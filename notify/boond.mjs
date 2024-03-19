import jwt from 'jsonwebtoken';
import axios from 'axios';
import FormData from 'form-data';
import {basename} from "path";
import * as fs from "fs";

const createToken = () => jwt.sign(
    {
        userToken: process.env.BOOND_USER_TOKEN,
        clientToken: process.env.BOOND_CLIENT_TOKEN,
        time: Date.now(),
        mode: "god"
    },
    process.env.BOOND_CLIENT_SECRET
)

const createClient = () => axios.create({
    baseURL: "https://ui.boondmanager.com/api",
    headers: {
        "X-Jwt-Client-BoondManager": createToken()
    }
});

const createNotifier = () => {
    const client = createClient();
    const documentPrefix = process.env.BOOND_DOCUMENT_PREFIX ?? 'mdcp_';

    const searchUser = async (name) => {
        const params = new URLSearchParams();
        params.append('keywords', name);
        params.append('keywordsType', 'fullname');

        const { data } = await client.get("/resources", { params });

        if (data.data && data.data.length !== 1) {
            throw new Error(`Expected only one result when searching for [${name}], got ${data.data}`);
        }

        return data.data[0];
    }

    const getDocuments = async (id) => {
        const { data } = await client.get(`resources/${id}/information`)

        return data.included.filter(it => it.type === 'document');
    }

    const deleteDocument = async (id) => {
        await client.delete(`documents/${id}`)
    }

    const uploadDocument = async ({ parentId, parentType, file, prefix }) => {
        const data = new FormData();

        data.append('parentType', parentType);
        data.append('parentId', parentId);
        data.append('file', fs.createReadStream(file), prefix + basename(file));

        await client.post(`documents`, data, {})
    }

    async function deletePreviousResumes(userId) {
        const previousResumes = (await getDocuments(userId))
            .filter(it => it.attributes.name.startsWith(documentPrefix));

        for (const previous of previousResumes) {
            await deleteDocument(previous.id);
        }
    }

    return async (documents) => {
        const perUser = Object.groupBy(
            documents.filter(it => it.status === 'success'),
            (document) => document.data.profile.name
        )

        console.log(`🟣 Uploading to boond ${documents.length} documents`);

        await Promise.all(Object.entries(perUser)
            .map(async ([username, documents]) => {
                const {id: userId} = await searchUser(username);

                await deletePreviousResumes(userId);

                for (const document of documents) {
                    await uploadDocument({
                        parentId: userId,
                        parentType: 'resourceResume',
                        file: document.file,
                        prefix: documentPrefix
                    })
                }
            })
        )

        console.log('  ✅ Successfully uploaded to Boond.');
    };
}


export const notifyBoond = (argv) => {
    if (String(argv.b ?? argv.boond) === 'true') {
        return createNotifier();
    }

    return () => Promise.resolve();
}