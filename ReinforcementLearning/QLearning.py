import numpy as np
import pandas as pd

class Data:
    Q = np.array([])
    num_discretized = 0
    def __init__(self, num_discretized, observation_space, action_space):
        l = [num_discretized] * len(observation_space.low)
        l.append(action_space.n)
        self.Q = np.zeros(tuple(l))
        self.num_discretized = num_discretized
        self.high = observation_space.high
        self.low = observation_space.low
        self.high[self.high > 1e30] = 1e30
        self.low[self.low < -1e30] = -1e30
        
    def get_Q_value(self, observation):
        idxs = self.__get_indices(observation)
        return self.Q[tuple(idxs)]
    
    def __bins(self, clip_min, clip_max, num):
        return np.linspace(clip_min, clip_max, num + 1)[1:-1]
    
    def __get_indices(self, observation):
        # idxs = np.floor((observation - self.low) / ((self.high - self.low)/self.num_discretized)).astype(np.int16)
        idxs = np.array([np.digitize(observation[0], bins=self.__bins(-2.4, 2.4, self.num_discretized)),
                        np.digitize(observation[1], bins=self.__bins(-3.0, 3.0, self.num_discretized)),
                        np.digitize(observation[2], bins=self.__bins(-0.5, 0.5, self.num_discretized)),
                        np.digitize(observation[3], bins=self.__bins(-2.0, 2.0, self.num_discretized))])
        return idxs
        
        
    # [3]Qテーブルを更新する関数 -------------------------------------
    def update_Data(self, observation, action, reward, next_observation, params):
        next_Max_Q=np.max(self.get_Q_value(next_observation))
        idxs = self.__get_indices(observation)
        self.Q[tuple(idxs)][action] = (1 - params['alpha']) * self.Q[tuple(idxs)][action]
        self.Q[tuple(idxs)][action] += params['alpha'] * (reward + params['gamma'] * next_Max_Q)
        
    def show(self):
        df = pd.DataFrame(self.Q)
        print(df)

class Agent:           
    # [2]行動a(t)を求める関数 -------------------------------------
    def get_action(self, observation, data, i_episode):
               #徐々に最適行動のみをとる、ε-greedy法
        epsilon = 0.5 * (1 / (i_episode + 1))
        if epsilon <= np.random.uniform(0, 1):
            action = np.argmax(data.get_Q_value(observation))
        else:
            action = np.random.choice([0, 1])
        return action
