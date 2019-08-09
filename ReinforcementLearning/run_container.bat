docker stop rl_cpu
docker rm rl_cpu
docker run -p 8888:8888 -v ~/:/src --restart=always --name rl_cpu rl