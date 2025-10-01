import random, z3

# Source: https://github.com/python/cpython/blob/main/Modules/_randommodule.c
# Assuming Little Endian. Not sure how to handle Big Endian
# Python Version 3
class MT19937:
    N           = 624
    M           = 397
    MATRIX_A    = 0x9908b0df
    UPPER_MASK  = 0x80000000
    LOWER_MASK  = 0x7fffffff
    UINT32_MASK = 0xffffffff

    def __init__(self, state=None):
        if state != None:
            assert isinstance(state, list) and len(state) == self.N
            self.state = state[:]
        else:
            self.state = [0 for _ in range(self.N)]

    def _xor_right_shift(self, y: int, shamt: int) -> int:
        return y ^ (y >> shamt)

    def _inv_xor_right_shift(self, y: int, shamt: int) -> int:
        x = y
        for _ in range(32 // shamt + 1):
            x = y ^ (x >> shamt)
        return x

    def _xor_left_shift(self, y: int, shamt: int, a: int) -> int:
        return y ^ ((y << shamt) & a)

    def _inv_xor_left_shift(self, y: int, shamt: int, a: int) -> int:
        x = y
        for _ in range(32 // shamt + 1):
            x = y ^ ((x << shamt) & a)
        return x

    def _twist(self, y: int) -> int:
        y = self._xor_right_shift(y, 11)
        y = self._xor_left_shift(y, 7, 0x9d2c5680)
        y = self._xor_left_shift(y, 15, 0xefc60000)
        y = self._xor_right_shift(y, 18)
        return y
        
    def _inv_twist(self, y: int) -> int:
        y = self._inv_xor_right_shift(y, 18)
        y = self._inv_xor_left_shift(y, 15, 0xefc60000)
        y = self._inv_xor_left_shift(y, 7, 0x9d2c5680)
        y = self._inv_xor_right_shift(y, 11)
        return y

    def init_genrand(self, s: int) -> None:
        mt = self.state
        mt[0] = s
        for i in range(1, self.N):
            mt[i] = (1812433253 * (mt[i-1] ^ (mt[i-1] >> 30)) + i) & self.UINT32_MASK

    def init_by_array(self, init_key: list[int]) -> None:
        mt = self.state
        key_length = len(init_key)
        self.init_genrand(19650218)
        K = self.N if self.N > key_length else key_length
        i, j = 1, 0
        for k in range(K, 0, -1):
            mt[i] = ((mt[i] ^ ((mt[i-1] ^ (mt[i-1] >> 30)) * 1664525))
                + init_key[j] + j) & self.UINT32_MASK
            i += 1
            j += 1
            if i >= self.N:
                mt[0] = mt[self.N - 1]
                i = 1
            if j >= key_length:
                j = 0
        for k in range(self.N - 1, 0, -1):
            mt[i] = ((mt[i] ^ ((mt[i-1] ^ (mt[i-1] >> 30)) * 1566083941))
                - i) & self.UINT32_MASK
            i += 1
            if i >= self.N:
                mt[0] = mt[self.N - 1]
                i = 1
        mt[0] = 0x80000000

    def _convert_int_to_array(self, s: int) -> list[int]:
        arr = s.to_bytes(max(1, (s.bit_length() + 31) // 32) * 4, "little")
        arr = [int.from_bytes(arr[i:i+4], "little") for i in range(0, len(arr), 4)]
        return arr
    
    def _convert_array_to_int(self, arr: list[int]) -> int:
        return sum([arr[i] * 2**(32*i) for i in range(len(arr))])
    
    def seed(self, s) -> None:
        assert isinstance(s, int)
        key = self._convert_int_to_array(s)
        self.init_by_array(key)

    def set_state(self, state: list[int]) -> None:
        self.state = state

    def _next_uint32(self) -> int:
        y = 0
        mt = self.state
        mt = mt[1:] + [mt[0]]
        y = (mt[self.N-1]&self.UPPER_MASK) | (mt[0]&self.LOWER_MASK)
        mt[self.N-1] = mt[self.M-1] ^ (y >> 1) ^ ((y & 1) * self.MATRIX_A)
        mt[0] = mt[0] & self.UPPER_MASK # modified
        self.state = mt[:]
        return self._twist(mt[self.N-1])

    def _prev_uint32(self) -> int:
        y = 0
        mt = self.state
        y0 = (mt[self.N-1] ^ mt[self.M-1]) >> 31
        y = y0 | (((mt[self.N-1] ^ mt[self.M-1] ^ (y0 * self.MATRIX_A)) & self.LOWER_MASK) << 1)
        mt = [y&self.UPPER_MASK] + [(mt[0]&self.UPPER_MASK) | (y&self.LOWER_MASK)] + mt[1:-1]
        self.state = mt[:]
        return self._twist(mt[0])

    def random(self) -> float:
        a = self._next_uint32() >> 5
        b = self._next_uint32() >> 6
        return (a * 2**26 + b) / 2**53
    
    def randbytes(self, n: int) -> bytes:
        res = b""
        while len(res) < n:
            res += self._next_uint32().to_bytes(4, "little")[max(0, 4 - (n - len(res))):]
        return res[:n]

    def getrandbits(self, k: int) -> int:
        if k == 0: return 0
        words = [self._next_uint32() for _ in range((k + 31) // 32)]
        words[-1] = words[-1] >> ((32 - k) % 32)
        return int.from_bytes(b"".join([w.to_bytes(4, "little") for w in words]), "little")

class MT19937Reverser:
    def __init__(self):
        self.prev_results = []
    
    def assert_next_uint32(self, l: int = None, r: int = None) -> None:
        if l == None and r == None: l, r = 0, MT19937.UINT32_MASK
        if r == None: r = l
        self.prev_results.append([l, r])
    
    def assert_random(self, r: float) -> None:
        r = int(r * 2**53)
        a, b = r >> 26, r & (2**26 - 1)
        self.assert_next_uint32(a << 5, ((a + 1) << 5) - 1)
        self.assert_next_uint32(b << 6, ((b + 1) << 6) - 1)
    
    def assert_randbytes(self, n: int, b: bytes) -> None:
        assert len(b) == n
        self.assert_getrandbits(n * 8, int.from_bytes(b, "little"))

    def assert_getrandbits(self, k: int, n: int) -> None:
        assert 0 <= n and n < 2**k
        words = [(n >> (_ * 32)) & (2**32 - 1) for _ in range((k + 31) // 32)]
        for w in words[:-1]:
            self.assert_next_uint32(w)
        shamt = (32 - k) % 32
        self.assert_next_uint32(words[-1] << shamt, ((words[-1] + 1) << shamt) - 1)
    
    # merge with reverse_state?
    # don't know how to merge properly
    def reverse_state_msb(self):
        solver = z3.Solver()
        mti = [z3.BitVec(f"mt{i}", 64) for i in range(MT19937.N)]
        mt = MT19937(mti)
        for i in range(MT19937.N):
            solver.add(0 <= mt.state[i], mt.state[i] <= mt.UINT32_MASK)
        solver.add(mt.state[0] >= mt.UPPER_MASK) # msb
        for l, r in self.prev_results:
            x = mt._next_uint32()
            solver.add(l <= x, x <= r)
        assert solver.check() == z3.sat, "Constraints inconsistent"
        model = solver.model()
        state = [int(model[mti[_]].as_long() & mt.UINT32_MASK) for _ in range(mt.N)]
        return state

    def reverse_state(self):
        solver = z3.Solver()
        mti = [z3.BitVec(f"mt{i}", 64) for i in range(MT19937.N)]
        mt = MT19937(mti)
        for i in range(MT19937.N):
            solver.add(0 <= mt.state[i], mt.state[i] <= mt.UINT32_MASK)
        L = min(len(self.prev_results), MT19937.N - 1)
        for i in range(L):
            l, r = self.prev_results[i]
            x = mt._twist(mt.state[-L+i])
            solver.add(l <= x, x <= r)
        for i in range(MT19937.N - 1, len(self.prev_results)):
            l, r = self.prev_results[i]
            x = mt._next_uint32()
            solver.add(l <= x, x <= r)
        assert solver.check() == z3.sat, "Constraints inconsistent"
        model = solver.model()
        state = [int(model[mti[_]].as_long() & mt.UINT32_MASK) for _ in range(mt.N)]
        mt = MT19937(state)
        for i in range(MT19937.N - 1, len(self.prev_results)):
            mt._next_uint32()
        return mt.state

    def reverse_seed(self, target_state: list[int]):
        solver = z3.Solver()
        key = [z3.BitVec(f"key{i}", 64) for i in range(MT19937.N)]
        mt = MT19937()
        mt.init_by_array(key)
        for _ in range(mt.N):
            solver.add(mt.state[_] == target_state[_])
        assert solver.check() == z3.sat, "Constraints inconsistent"
        model = solver.model()
        init_key = [int(model[key[_]].as_long() & mt.UINT32_MASK) for _ in range(mt.N)]
        return init_key


def test_mt19937():
    seed = 12342384294723482723848932742934728974937
    random.seed(seed)
    rng = MT19937()
    rng.seed(seed)
    
    assert list(random.getstate()[1][:-1]) == rng.state
    assert random.random() == rng.random()
    
    # randbytes
    for _ in range(16):
        assert random.randbytes(_) == rng.randbytes(_)
    
    # getrandbits
    for _ in range(128):
        assert random.getrandbits(_) == rng.getrandbits(_)
    
    # _prev_uint32
    state_1 = rng.state[:]
    for _ in range(1000):
        rng._prev_uint32()
    for _ in range(1000):
        rng._next_uint32()
    state_2 = rng.state[:]
    assert state_1 == state_2

    # right shift
    for _ in range(100):
        y = random.getrandbits(32)
        shamt = 1 + random.getrandbits(5)
        assert rng._xor_right_shift(rng._inv_xor_right_shift(y, shamt), shamt) == y
    
    # left shift
    for _ in range(100):
        y = random.getrandbits(32)
        shamt = 1 + random.getrandbits(5)
        a = random.getrandbits(32)
        assert rng._xor_left_shift(rng._inv_xor_left_shift(y, shamt, a), shamt, a) == y
    
    # twist
    for _ in range(100):
        y = random.getrandbits(32)
        assert rng._inv_twist(rng._twist(y)) == y


def test_mt19937_reverser():
    reverser = MT19937Reverser()
    rng = MT19937()

    # Know internal state from first 624 uint32 output
    for _ in range(624):
        x = rng._next_uint32()
        reverser.assert_next_uint32(x)
    state_rev = reverser.reverse_state()
    assert rng.state == state_rev
    rng_rev = MT19937(reverser.reverse_state())
    for _ in range(624):
        assert rng._next_uint32() == rng_rev._next_uint32()
    
    # Find seed from internal state
    rng.seed(1234)
    init_key = reverser.reverse_seed(rng.state)
    rng_seed = MT19937()
    seed = rng._convert_array_to_int(init_key)
    rng_seed.seed(seed)
    for _ in range(624):
        assert(rng._next_uint32() == rng_seed._next_uint32())


if __name__ == "__main__":
    test_mt19937()
    test_mt19937_reverser()
