
## 

## Local run

```
podman run -v /path-to-local-repository:/input -v $(pwd)/dist:/output -e "CACHE_FOLDER=/cache" -v $(pwd)/cache:/cache publisher:latest --files="/input/**.yaml" --output="/output"
```

### CLI Configuration

#### Env Variables

 - `CACHE_FOLDER`: path to folder for caching values between runs
 - `SLACK_TOKEN`: used by slack-notifier to send message. See #slack-notifications

#### CLI params

All params are mandatory, unless specified otherwise

- `-f`, `--files=`: A space separated glob-like pattern list used to select YAML files to render.
- `-o`, `--output=`: Absolute path to output resulting file to
- `--slack-notify=`: If specified will send a slack notification with the files to the specified user. See #slack-notifications


## Integrations

### Slack notifications

To enable the integration, `slack` must be added to the notification list

This app can notify the author of a push, or any given author, on slack using direct messaging.

To map github users with slack users, the slack profile must contain a custom field with their github username as the `alt` value. 

The notify param must contain the field to look for and the github username separated by a `=`:

`<field ID>=<github username>`/

For instance:

`slack-notify: Xf06PFR9QAR3=almarzn`

The slack token must have these permissions:

```
- users.profile:read
- users:read
- channels:manage
- groups:write
- im:write
- mpim:write
- files:write
- chat:write
```