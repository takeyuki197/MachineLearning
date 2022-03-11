import numpy as np
import pandas as pd
import scipy.stats as stats

import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F

zero_floor = np.vectorize(lambda x: max(0, x))

def get_pv(S, T, r, sigma, K, t=0):
    dt = T-t
    Phi = stats.norm(loc=0, scale=1).cdf
    d1 = (np.log(S/K) + (r+sigma**2/2)*dt) / (sigma*np.sqrt(dt))
    d2 = d1 - sigma*np.sqrt(dt)
    return S*Phi(d1) - K*np.exp(-r*dt)*Phi(d2)

def get_uniform(N, x_min, x_max):
    return np.random.rand(N)*(x_max - x_min) + x_min

def step(S, r, sigma, dt, dW):
    return S*np.exp((r-0.5*sigma**2)*dt+sigma*dW)

def generate_path(T, div_T, path_num):
    # t, S, r, sigma, strike, rec, haz, price
    state_num = 8
    initial_states = np.zeros((path_num, state_num))
    initial_states[:, 0] = T
    initial_states[:, 1] = get_uniform(path_num, 80.0, 130.0) #S
    initial_states[:, 2] = get_uniform(path_num, -0.01, 0.02) #r
    initial_states[:, 3] = get_uniform(path_num, 0.03, 0.2) #sigma
    initial_states[:, 4] = get_uniform(path_num, 80.0, 130.0) #strike
    initial_states[:, 5] = get_uniform(path_num, 0.2, 0.5) #rec
    initial_states[:, 6] = get_uniform(path_num, 0.001, 0.02) #haz
    initial_states[:, 7] = get_pv(initial_states[:,1], initial_states[:, 0], initial_states[:, 2], initial_states[:, 3], initial_states[:, 4])
    
    dw = np.random.randn(div_T, path_num)*np.sqrt(T/div_T)
    
    path = np.zeros((div_T + 1, path_num, state_num))
    path[0] = initial_states.copy()
    for i in range(div_T):
        t = (i + 1)*(T/div_T)
        initial_states[:, 0] = T - t
        initial_states[:, 1] = step(initial_states[:, 1], initial_states[:, 2], initial_states[:, 3], np.ones(path_num)*(T/div_T), dw[i])
        if i == div_T - 1:
            initial_states[:, 7] = 0.0
        else:
            initial_states[:, 7] = get_pv(initial_states[:,1], initial_states[:, 0], initial_states[:, 2], initial_states[:, 3], initial_states[:, 4])
        path[(i + 1)] = initial_states.copy()
    
    return path, dw

def calc_cva(init_state, T, div_T, path_num):
    t, S0, r, sigma, strike, rec, haz, price = init_state
    S = np.ones(path_num)*S0
    cva = 0.
    for i in range(div_T):
        t = i*(T/div_T)
        pvs = get_pv(S, T, r, sigma, strike, t)
        cva += (1. - rec)*np.average(zero_floor(pvs))*haz*(T/div_T)*np.exp(-r*t)
        S = step(S, r, sigma, T/div_T, np.random.randn(path_num))
    return cva
       
def f(X, Y, Z):
    return (1.0 - X[:, 5])*X[: ,6]*X[:, 7] - Y*X[:, 2]

def f_inv(X):
    return (1.0 - X[:, 5])*X[: ,6]*X[:, 7]
    
class Network(nn.Module):
    def __init__(self, input_size=1, 
                 output_size=1, hidden_size=32,
                 name='QNetwork'):
        nn.Module.__init__(self)
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, hidden_size)
        self.fc3 = nn.Linear(hidden_size, hidden_size)
        self.fc4 = nn.Linear(hidden_size, hidden_size)
        self.fc5 = nn.Linear(hidden_size, hidden_size)
        self.fc6 = nn.Linear(hidden_size, hidden_size)
        self.fc7 = nn.Linear(hidden_size, hidden_size)
        self.fc8 = nn.Linear(hidden_size, hidden_size)
        self.fc9 = nn.Linear(hidden_size, hidden_size)
        self.fc10 = nn.Linear(hidden_size, hidden_size)
        self.output = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        x = F.leaky_relu(self.fc1(x))
        x = F.leaky_relu(self.fc2(x))
        x = F.leaky_relu(self.fc3(x))
        x = F.leaky_relu(self.fc4(x))
        x = F.leaky_relu(self.fc5(x))
        x = F.leaky_relu(self.fc6(x))
        x = F.leaky_relu(self.fc7(x))
        x = F.leaky_relu(self.fc8(x))
        x = F.leaky_relu(self.fc9(x))
        x = F.leaky_relu(self.fc10(x))
        x = self.output(x)
        return x
