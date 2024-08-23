import { $ } from "execa";

export const executors = {
  local: ({ cwd, command, executable }) => {
    return $({ cwd })`${executable} ${command}`;
  },
  podman: ({ cwd, image, command, executable }) => {
    return $`podman run --rm -w=${cwd} -v ${cwd}:${cwd}:rshared --entrypoint=${executable} ${image} ${command}`;
  },
};
