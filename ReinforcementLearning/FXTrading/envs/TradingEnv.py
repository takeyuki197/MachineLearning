import gym
import pandas as pd
import numpy as np

class FxEnv(gym.Env):
    def __init__(self, scenario_length=1000, transaction_cost_ratio=0.01):
        super().__init__()
        # action_space, observation_space, reward_range を設定する
        self.action_space = gym.spaces.Discrete(3)  # Neutral, Buy, Sell
        self.df = pd.read_csv('./envs/quote.csv')
        self.scenario_length = scenario_length
        self.transaction_cost_ratio = transaction_cost_ratio
        self.reset()
    
    def calc_observation(self):
        action_vec = np.eye(3)[self.last_action].tolist()
        current_point = self.df['USD'][self.idx]
        velocity = self.df['USD'][self.idx] - self.df['USD'][self.idx-1]
        accelaration = self.df['USD'][self.idx] - 2*self.df['USD'][self.idx-1] + self.df['USD'][self.idx-2]
        downfall = self.df['USD'][self.idx-4:self.idx].max() - self.df['USD'][self.idx]
        upfall = self.df['USD'][self.idx] - self.df['USD'][self.idx-4:self.idx].min()
        rest_time = (self.start_idx + self.scenario_length - self.idx)/self.scenario_length
        
        return action_vec + [current_point, velocity, accelaration, downfall, upfall, rest_time]
     
    def reset(self):
        self.start_idx = np.random.choice(range(0, len(self.df)-self.scenario_length))
        self.idx = self.start_idx+4
        self.last_action = 0
        observation = self.calc_observation()
        
        return observation
        
    def step(self, action):
        if action == 0:
            position_sign = 0
        elif action == 1:
            position_sign = 1
        elif action == 2:
            position_sign = -1
            
        if self.last_action == action:
            transaction_cost = 0
        else:
            transaction_cost = self.df['USD'][self.idx] * self.transaction_cost_ratio
        
        if action == 0:
            reward = -transaction_cost
        else:
            reward = (self.df['USD'][self.idx+1] - self.df['USD'][self.idx])*position_sign - transaction_cost
            
        info = self.df['USD'][self.idx+1]
        
        self.idx += 1
        self.last_action = action
        
        observation = self.calc_observation()
        done = True if self.start_idx + self.scenario_length <= self.idx else False
        
        return observation, reward, done, info