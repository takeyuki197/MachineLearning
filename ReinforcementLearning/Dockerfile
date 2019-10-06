FROM tensorflow/tensorflow:1.13.1-py3-jupyter

RUN mkdir /src
WORKDIR /src

RUN apt-get update && \
    apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 

RUN pip install tensorflow_probability==0.6.0
RUN pip install gym
RUN pip install trfl

RUN pip install https://download.pytorch.org/whl/cpu/torch-1.1.0-cp35-cp35m-linux_x86_64.whl
RUN pip install https://download.pytorch.org/whl/cpu/torchvision-0.3.0-cp35-cp35m-linux_x86_64.whl

RUN pip install sklearn

RUN pip install ray[rllib]

RUN pip install optuna

CMD [ "jupyter", "notebook", "--ip", "0.0.0.0", "--allow-root", "--NotebookApp.token='rein'" ]
