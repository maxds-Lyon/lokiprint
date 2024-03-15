import { $ } from 'execa';

const createContainerExecutor = (executor) => ({
    cwd,
    image,
    command,
    executable
}) => {
    return $`${executor} run -w=${cwd} -v ${cwd}:${cwd}:rshared --entrypoint=${executable} ${image} ${command}`;
}

export const executors = {
    local: ({
        cwd, command, executable
    }) => {
        return $({ cwd })`${executable} ${command}`;
    },
    podman: createContainerExecutor('podman'),
    docker: createContainerExecutor('docker')
};
