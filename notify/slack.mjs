import { WebClient } from '@slack/web-api';
import { promises as fs } from 'fs';
import { join } from 'path';

const getCache = async (key) => {
    const cacheFolder = join(process.env.CACHE_FOLDER, "slack-notifier");

    await fs.mkdir(cacheFolder, { recursive: true });

    return {
        write: (content) => fs.writeFile(join(cacheFolder, key), JSON.stringify(content), 'utf-8'),
        read: async () => {
            try {
                JSON.parse(await fs.readFile(join(cacheFolder, key), 'utf-8'))
            } catch (err) {
                console.log("Cannot read cache: " + err.message);
            }
        }
    }
}

const getSendResults = ({ 
    web,
    cache,
    usernameField
}) => {
    const findUserWithGithubHandle = async (userList, username) => {
        for (const member of userList.members) {
            const profile = await web.users.profile.get({
                user: member.id
            });
    
            if (!profile.ok) {
                throw new Error(profile.error);
            }

            if (profile.profile.fields[usernameField]) {
                cache[profile.profile.fields[usernameField].alt] = member.id;

                if (profile.profile.fields[usernameField].alt === username) {
                    return member.id
                }
            }
        }

        return null;
    }

    const getMatchingUserId = async (username) => {
        if (cache[username]) {
            return cache[username];
        }

        const userList = await web.users.list();

        if (userList.ok) {
            const memberId = await findUserWithGithubHandle(userList, username);

            if (!memberId) {
                console.log(`Could not notify [${memberId}]`);
            }

            console.log("Going to notify " + memberId);

            return memberId;
        }

        throw new Error(userList.error);
    }

    const openChat = async (userId) => {
        const conv = await web.conversations.open({ users: userId });

        if (conv.ok) {
            return conv.channel.id;
        }

        throw new Error(conv.error);
    }

    const sendResults = async (username, results) => {
        const userId = await getMatchingUserId(username);

        if (!userId) {
            return;
        }

        const convId = await openChat(userId);

        web.chat.postMessage({
            blocks: [{
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Oh oh oh!* Voici le ou les DC demandés :streetloki:

${
results.map(res => res.status == 'success' ? ` - :white_check_mark:  ${res.item} a pu être généré` :
    ` - :x:  ${res.item} n'a pas pu être généré, pour cause: \`${res.message.trim()}\``).join('\n')
}`
                }
            }],
            text: `Oh oh oh! Voici le ou les DC demandés :streetloki:`,
            channel: convId
        })

        web.files.uploadV2({
            file_uploads: results
                .filter(result => result.status === 'success')
                .map(result => ({
                    file: result.file,
                    title: result.item,
                    filename: result.item
                })),
            channel_id: convId,
        })
    }

    return sendResults;
}

export const notifySlack = (argv) => { 
    const token = process.env.SLACK_TOKEN;
    const slackNotify = argv['slack-notify'];

    if (!slackNotify) return () => Promise.resolve();

    const [usernameField, author] = slackNotify.split("=");

    return async (results) => {
        const userMappingCache = await getCache("user_mappings");
        const cache = await userMappingCache.read() ?? {};

        const sendResults = getSendResults({
            web: new WebClient(token),
            usernameField,
            cache
        });

        await sendResults(author, results);

        await userMappingCache.write(cache);
    }
}

