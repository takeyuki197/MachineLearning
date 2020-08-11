docker stop rl_cpu
docker rm rl_cpu
docker run -d -p 8888:8888 -v %CD%/:/src --restart=always --name rl_cpu rl