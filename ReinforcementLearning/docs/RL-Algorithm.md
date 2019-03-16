## Value Based なアルゴリズム
### Value Based とは
+ 価値関数（V）または行動価値関数（Q）を Bellman equation を利用して更新する手法
+ 環境（又は環境 + 行動）から収益（return）へのマップを作成する

### DQN
+ Q学習では一般的にQをテーブルで表現するが、状態数や行動数が多い問題設定はメモリ上で表現ができなくなる
+ そこで、DQNはQ学習の行動価値関数Qをニューラルネットで表している
+ 一般的なDQNはニューラルネットを用いる点に加え以下の3点の工夫を行っている
    + Experience Replay
        + 過去の経験には貴重なものがあるかもしれず、学習の収束速度を上げるために過去の経験を再学習する手法
        + 環境が変化するような問題では逆に誤った方向に学習が進む可能性
        + 参考）Lin, Long-Ji, "Self-Improving Reactive Agents Based On Reinforcement Learning, Planning and Teaching"
    + Neural Fitted Q Iteration
        + オンライン学習ではニューラルネットが安定しないため、一旦経験した状態や行動、報酬をメモリにためてバッチ的に学習する手法
        + 参考）Martin Riedmiller, "Neural fitted Q iteration–first experiences with a data efficient neural reinforcement learning method"
    + Reward Clipping
        + 報酬を[-1, 1]の範囲にクリップしQ値の急激な増大を抑制する
        + 報酬をクリップすることで勾配が安定する

### Advantage-QLearning
+ TD法とQ学習を組み合わせたもの
+ 数ステップ先までの報酬や行動から現在の状態を評価する手法
+ 数式


## Policy Based なアルゴリズム
### Value Based の欠点
+ 強化学習の目標が収益を最大化することであることを踏まえると、価値関数を最適化することは直接の目標ではない
+ 全ての環境における全ての行動を調べることは計算コストが高い

### Policy Based とは
+ 方策（π）を関数とし方策の最適化を行う手法

### 方策勾配法
+ 方策関数をΘでパラメタライズし、そのΘで期待収益の勾配を求めてΘを更新する手法
+ 方策関数には以下の関数を用いることが多い
+ 数式

## Actor-Critic
### Policy Based の欠点
+ 学習が不安定

### Actor-Critic とは
+ Policy Based な手法（Actor）と Value Based な手法（Critic）を組み合わせた手法

### A3C
