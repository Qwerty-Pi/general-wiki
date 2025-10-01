from sage.all import *
from Crypto.Util.number import *
from Crypto.Cipher import AES
from os import urandom
import struct

class GaloisFieldBinary:
    def __init__(self):
        x = PolynomialRing(GF(2), "x").gens()[0]
        f = x**128 + x**7 + x**2 + x + 1
        F = GF(2**128, modulus=f, name="t")

        self.F = F
        self.t = F.gens()[0]
    
    '''
        Conversion:
        e => element
        i => integer
        b => bytes
    '''
    def itoe(self, x):
        return sum([self.t ** _ * ((x >> _) & 1) for _ in range(128)])
    
    def etoi(self, e):
        return sum([b.lift() * 2 ** _ for _, b in enumerate(e.list())])

    def btoi(self, B):
        x, cnt = 0, 0
        for b in B:
            v = sum(((b & 2**_) >> _) * 2**(7-_) for _ in range(8))
            x = x | (v << (8 * cnt))
            cnt += 1
        return x

    def itob(self, x):
        B = b""
        for _ in range(16):
            B += sum((((x % 256) & 2**_) >> _) * 2**(7-_) for _ in range(8)).to_bytes(1, "little")
            x //= 256
        return B

    def btoe(self, B):
        return self.itoe(self.btoi(B))

    def etob(self, e):
        return self.itob(self.etoi(e))

    def pad(self, B, l):
        while len(B) % l != 0:
            B += b"\0"
        return B

    def phash(self, S, H):
        hsh = 0
        for _ in range(0, len(S), 16):
            hsh = hsh * self.btoe(H) + self.btoe(S[_:_+16])
        return hsh

    def ghash(self, A, C, H, H0):
        L_A = struct.pack(">Q", len(A) * 8)
        L_C = struct.pack(">Q", len(C) * 8)
        S = self.pad(A, 16) + self.pad(C, 16) + L_A + L_C + H0
        return self.phash(S, H)

if __name__ == '__main__':
    G = GaloisFieldBinary()
    assert G.itob(1) == b"\x80" + b"\x00" * 15
    assert G.btoe(b"\xC0\x01") == G.t**15 + G.t + 1

    key, nonce = urandom(16), urandom(12)
    new = lambda: AES.new(key, AES.MODE_GCM, nonce)

    cipher = new()
    H = AES.new(key, AES.MODE_ECB).encrypt(b"\0" * 16)
    H0 = AES.new(key, AES.MODE_ECB).encrypt(nonce + b"\0\0\0\1")
    assert new().digest() == H0
    assert new().update(b"\0").digest() == G.etob(G.ghash(b"\0", b"", H, H0))
    for _ in range(100):
        A, P = urandom(_), urandom(_)
        cipher = new()
        cipher.update(A)
        cipher.encrypt(P)
        C = new().encrypt(P)
        print(_)
        assert cipher.digest() == G.etob(G.ghash(A, C, H, H0))
