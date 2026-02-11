
#include "modulo.h"
const int MOD = 1e9 + 7;
using Zn = Z<MOD>;

int floor_div(int a, int c) {
    if (a < 0) return -((-a + c - 1) / c);
    return a / c;
}

Zn S_0(int n) {
    return Zn(n);
}

Zn S_1(int n) {
    return Zn(n) * (n + 1) / 2;
}

Zn S_2(int n) {
    return Zn(n) * (n + 1) * (n * 2 + 1) / 6;
}

struct ZF {
    Zn y, yy, xy;
};

ZF F(int n, int a, int b, int c) {
    if (a < 0 || a >= c) {
        int d = floor_div(a, c);
        ZF G = F(n, a - d * c, b, c);
        return {
            S_1(n) * d + G.y,
            S_2(n) * d * d + G.xy * d * 2 + G.yy,
            S_2(n) * d + G.xy
        };
    }
    if (b < 0 || b >= c) {
        int d = floor_div(b, c);
        ZF G = F(n, a, b - d * c, c);
        return {
            S_0(n) * d + G.y,
            S_0(n) * d * d + G.y * d * 2 + G.yy,
            S_1(n) * d + G.xy
        };
    }
    if (a == 0) return {};
    int m = (a * n + b) / c;
    ZF G = F(m, c, -b - 1, a);
    return {
        Zn(n) * m - G.y,
        Zn(n) * m * m - (G.xy * 2 - G.y),
        S_1(n) * m - (G.yy + G.y) / 2
    };
}