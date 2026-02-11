#include <bits/stdc++.h>
using namespace std;
#define int long long

#include "modulo.h"
const int MOD = 1e9 + 7;
using Zn = Z<MOD>;
Zn G_y(int n, int a, int b, int c) {
    Zn ans = 0;
    for (int i = 1; i <= n; i++) {
        ans += (a * i + b) / c;
    }
    return ans;
}

Zn G_yy(int n, int a, int b, int c) {
    Zn ans = 0;
    for (int x = 1; x <= n; x++) {
        Zn y = (a * x + b) / c;
        ans += y * y;
    }
    return ans;
}

Zn G_xy(int n, int a, int b, int c) {
    Zn ans = 0;
    for (int x = 1; x <= n; x++) {
        Zn y = (a * x + b) / c;
        ans += Zn(x) * y;
    }
    return ans;
}

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

Zn F_y(int n, int a, int b, int c) {
    if (a < 0 || a >= c) {
        int d = floor_div(a, c);
        return S_1(n) * d + F_y(n, a - d * c, b, c);
    }
    if (b < 0 || b >= c) {
        int d = floor_div(b, c);
        return S_0(n) * d + F_y(n, a, b - d * c, c);
    }
    if (a == 0) return 0;
    int m = (a * n + b) / c;
    return Zn(n) * m - F_y(m, c, -b - 1, a);
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

int32_t main() {
    const int n = 49582, a = 24806, b = 139184, c = 295829;
    cout << G_y(n, a, b, c) << '\n';
    cout << F_y(n, a, b, c) << '\n';
    cout << F(n, a, b, c).y << '\n';
    
    cout << G_yy(n, a, b, c) << '\n';
    cout << F(n, a, b, c).yy << '\n';
    
    cout << G_xy(n, a, b, c) << '\n';
    cout << F(n, a, b, c).xy << '\n';
}