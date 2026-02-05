"""
BuildingElevator-v0: N층 건물, M대 엘리베이터 제어 환경.
기본: 20층, 6대. 명세: docs/BuildingElevator-v0/BuildingElevator-v0 환경 명세.md
렌더 없음 (환경만).
"""

from __future__ import annotations

import gymnasium as gym
from gymnasium import spaces
import numpy as np


ACTION_STAY = 0
ACTION_MOVE_UP = 1
ACTION_MOVE_DOWN = 2
ACTION_OPEN_DOOR = 3
ACTION_CLOSE_DOOR = 4

NUM_FLOORS_DEFAULT = 20
NUM_ELEVATORS_DEFAULT = 6
CAPACITY = 10
DEFAULT_MAX_STEPS = 1000

REWARD_PER_STEP_PER_WAITING = -0.1
REWARD_PER_ARRIVAL = 10.0
PENALTY_DOOR_OPEN_MOVE = -10.0
PENALTY_BOUNDARY = -1.0
PENALTY_EMPTY_FLOOR_OPEN = -0.5


class BuildingElevatorEnv(gym.Env):
    """N층 건물, M대 엘리베이터. 에이전트가 매 스텝 각 엘리베이터에 행동을 지시."""

    metadata = {"render_modes": []}

    def __init__(
        self,
        num_floors: int = NUM_FLOORS_DEFAULT,
        num_elevators: int = NUM_ELEVATORS_DEFAULT,
        max_steps: int = DEFAULT_MAX_STEPS,
        passenger_spawn_rate: float = 0.15,
        use_single_action: bool = True,
        reward_per_step_per_waiting: float = REWARD_PER_STEP_PER_WAITING,
        reward_per_arrival: float = REWARD_PER_ARRIVAL,
        penalty_door_open_move: float = PENALTY_DOOR_OPEN_MOVE,
        penalty_boundary: float = PENALTY_BOUNDARY,
        penalty_empty_floor_open: float = PENALTY_EMPTY_FLOOR_OPEN,
        render_mode: str | None = None,
        seed: int | None = None,
    ):
        super().__init__()
        self.num_floors = num_floors
        self.num_elevators = num_elevators
        self.max_steps = max_steps
        self.passenger_spawn_rate = passenger_spawn_rate
        self.use_single_action = use_single_action
        self._reward_per_step_per_waiting = reward_per_step_per_waiting
        self._reward_per_arrival = reward_per_arrival
        self._penalty_door_open_move = penalty_door_open_move
        self._penalty_boundary = penalty_boundary
        self._penalty_empty_floor_open = penalty_empty_floor_open
        self.render_mode = render_mode

        nf, ne = num_floors, num_elevators
        self.observation_space = spaces.Dict({
            "elevator_state": spaces.Box(
                low=np.array([[0, -1, 0, 0]] * ne, dtype=np.float32),
                high=np.array([[nf - 1, 1, 1, CAPACITY]] * ne, dtype=np.float32),
                dtype=np.float32,
            ),
            "hall_up_calls": spaces.MultiBinary(nf),
            "hall_down_calls": spaces.MultiBinary(nf),
            "car_calls": spaces.MultiBinary((ne, nf)),
        })
        if use_single_action:
            self.action_space = spaces.Discrete(ne * 5)
        else:
            self.action_space = spaces.MultiDiscrete([5] * ne)

        self._elevator_floor = np.zeros(ne, dtype=np.int32)
        self._elevator_direction = np.zeros(ne, dtype=np.int32)
        self._door_open = np.zeros(ne, dtype=bool)
        self._load = np.zeros(ne, dtype=np.int32)
        self._car_destinations: list[list[int]] = [[] for _ in range(ne)]
        self._hall_up_calls = np.zeros(nf, dtype=np.uint8)
        self._hall_down_calls = np.zeros(nf, dtype=np.uint8)
        self._car_calls = np.zeros((ne, nf), dtype=np.uint8)
        self._waiting_at_floor: list[list[int]] = [[] for _ in range(nf)]
        self._step_count = 0
        self._max_passengers = 0
        self._rng = np.random.default_rng(seed)

    def _get_total_waiting(self) -> int:
        return sum(len(w) for w in self._waiting_at_floor) + sum(
            len(self._car_destinations[e]) for e in range(self.num_elevators)
        )

    def _get_current_passengers(self) -> int:
        return self._get_total_waiting()

    def _update_hall_calls_for_floor(self, floor: int) -> None:
        up = any(d > floor for d in self._waiting_at_floor[floor])
        down = any(d < floor for d in self._waiting_at_floor[floor])
        self._hall_up_calls[floor] = 1 if up else 0
        self._hall_down_calls[floor] = 1 if down else 0

    def _spawn_passengers(self) -> None:
        nf = self.num_floors
        for f in range(nf):
            n = self._rng.poisson(self.passenger_spawn_rate)
            for _ in range(n):
                other = [x for x in range(nf) if x != f]
                if not other:
                    continue
                dest = int(self._rng.choice(other))
                self._waiting_at_floor[f].append(dest)
        for f in range(nf):
            self._update_hall_calls_for_floor(f)

    def _build_obs(self) -> dict:
        ne, nf = self.num_elevators, self.num_floors
        elevator_state = np.zeros((ne, 4), dtype=np.float32)
        for e in range(ne):
            elevator_state[e] = (
                float(self._elevator_floor[e]),
                float(self._elevator_direction[e]),
                float(1 if self._door_open[e] else 0),
                float(self._load[e]),
            )
        return {
            "elevator_state": elevator_state,
            "hall_up_calls": self._hall_up_calls.copy(),
            "hall_down_calls": self._hall_down_calls.copy(),
            "car_calls": self._car_calls.copy(),
        }

    def reset(self, seed: int | None = None, options: dict | None = None) -> tuple[dict, dict]:
        super().reset(seed=seed)
        if seed is not None:
            self._rng = np.random.default_rng(seed)

        ne, nf = self.num_elevators, self.num_floors
        self._elevator_floor = np.zeros(ne, dtype=np.int32)
        self._elevator_direction = np.zeros(ne, dtype=np.int32)
        self._door_open = np.zeros(ne, dtype=bool)
        self._load = np.zeros(ne, dtype=np.int32)
        self._car_destinations = [[] for _ in range(ne)]
        self._hall_up_calls = np.zeros(nf, dtype=np.uint8)
        self._hall_down_calls = np.zeros(nf, dtype=np.uint8)
        self._car_calls = np.zeros((ne, nf), dtype=np.uint8)
        self._waiting_at_floor = [[] for _ in range(nf)]
        self._step_count = 0
        self._max_passengers = 0
        self._spawn_passengers()
        self._max_passengers = max(self._max_passengers, self._get_current_passengers())
        return self._build_obs(), {
            "step": self._step_count,
            "waiting": self._get_total_waiting(),
            "max_passengers": self._max_passengers,
        }

    def step(self, action: np.ndarray | list | int) -> tuple[dict, float, bool, bool, dict]:
        ne, nf = self.num_elevators, self.num_floors
        reward = 0.0
        if self.use_single_action:
            a_flat = int(action)
            a_flat = max(0, min(ne * 5 - 1, a_flat))
            elevator_id = a_flat // 5
            act = a_flat % 5
            actions = np.zeros(ne, dtype=np.int32)
            actions[elevator_id] = act
        else:
            actions = np.atleast_1d(np.asarray(action, dtype=np.int32)).ravel()
            if len(actions) != ne:
                actions = np.resize(actions, ne)

        for e in range(ne):
            a = int(actions[e])
            f = self._elevator_floor[e]

            if a == ACTION_OPEN_DOOR and not self._door_open[e]:
                drop_off = sum(1 for d in self._car_destinations[e] if d == f)
                pick_up = len(self._waiting_at_floor[f])
                if drop_off == 0 and pick_up == 0:
                    reward += self._penalty_empty_floor_open

            if self._door_open[e] and (a == ACTION_MOVE_UP or a == ACTION_MOVE_DOWN):
                reward += self._penalty_door_open_move
            if a == ACTION_MOVE_DOWN and f == 0:
                reward += self._penalty_boundary
            if a == ACTION_MOVE_UP and f == nf - 1:
                reward += self._penalty_boundary

            if a == ACTION_MOVE_UP and not self._door_open[e] and f < nf - 1:
                self._elevator_floor[e] += 1
                self._elevator_direction[e] = 1
            elif a == ACTION_MOVE_DOWN and not self._door_open[e] and f > 0:
                self._elevator_floor[e] -= 1
                self._elevator_direction[e] = -1
            elif a == ACTION_OPEN_DOOR:
                if not self._door_open[e]:
                    self._door_open[e] = True
                    remaining = [d for d in self._car_destinations[e] if d != f]
                    delivered = len(self._car_destinations[e]) - len(remaining)
                    self._car_destinations[e] = remaining
                    self._load[e] = len(self._car_destinations[e])
                    for _ in range(delivered):
                        reward += self._reward_per_arrival
                    self._car_calls[e, f] = 0
                    for d in set(self._car_destinations[e]):
                        self._car_calls[e, d] = 1
                    waiting = self._waiting_at_floor[f]
                    if self._elevator_direction[e] > 0:
                        to_board = [d for d in waiting if d > f]
                    elif self._elevator_direction[e] < 0:
                        to_board = [d for d in waiting if d < f]
                    else:
                        to_board = list(waiting)
                    boarded = []
                    for d in to_board:
                        if self._load[e] >= CAPACITY:
                            break
                        self._car_destinations[e].append(d)
                        self._car_calls[e, d] = 1
                        self._load[e] += 1
                        boarded.append(d)
                    self._waiting_at_floor[f] = [d for d in waiting if d not in boarded]
                    self._update_hall_calls_for_floor(f)
            elif a == ACTION_CLOSE_DOOR:
                self._door_open[e] = False

        waiting_count = self._get_total_waiting()
        reward += self._reward_per_step_per_waiting * waiting_count
        self._spawn_passengers()
        self._step_count += 1
        self._max_passengers = max(self._max_passengers, self._get_current_passengers())
        truncated = self._step_count >= self.max_steps
        info = {
            "step": self._step_count,
            "waiting": self._get_total_waiting(),
            "max_passengers": self._max_passengers,
        }
        return self._build_obs(), reward, False, truncated, info

    def render(self) -> None:
        return None

    def close(self) -> None:
        pass


gym.register(
    id="BuildingElevator-v0",
    entry_point="skyscraper_elevators_env.building_elevator_env:BuildingElevatorEnv",
    max_episode_steps=DEFAULT_MAX_STEPS,
    kwargs={
        "num_floors": NUM_FLOORS_DEFAULT,
        "num_elevators": NUM_ELEVATORS_DEFAULT,
        "max_steps": DEFAULT_MAX_STEPS,
        "use_single_action": True,
    },
)
