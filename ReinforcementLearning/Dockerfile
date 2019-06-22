FROM tensorflow/tensorflow:1.13.1-py3-jupyter

RUN mkdir /src
WORKDIR /src

RUN pip install tensorflow_probability==0.6.0
RUN pip install gym
RUN pip install trfl

CMD [ "jupyter", "notebook", "--ip", "0.0.0.0", "--allow-root" ]
