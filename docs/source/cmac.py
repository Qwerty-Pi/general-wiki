
def SUBK(K):
    cipher = AES.new(K, AES.MODE_ECB)
    L = bytes_to_long(cipher.encrypt(b"\0" * 16))
    if L & (1 << 127):
        K1 = ((L << 1) ^ 135) & ((1 << 128) - 1)
    else:
        K1 = L << 1
    if K1 & (1 << 127):
        K2 = ((K1 << 1) ^ 135) & ((1 << 128) - 1)
    else:
        K2 = K1 << 1
    return long_to_bytes(K1), long_to_bytes(K2)


