docker stop tf_trfl
docker rm tf_trfl
docker run -p 8888:8888 -v ~/:/src --name tf_trfl tf