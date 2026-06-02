const int MOD = 998244353;
int pm(int a, int b) {
	return b == 0 ? 1 : pm(a * a % MOD, b / 2) * (b % 2 ? a : 1) % MOD;
}
int mi(int a) {
	return pm(a, MOD - 2);
}

vector<int> fa, fi;
int binom(int n, int r) {
	if (r < 0 || r > n || n < 0) return 0;
	return fa[n] * fi[r] % MOD * fi[n - r] % MOD;
}

void precalc(int N) {
	fa = fi = vector<int>(N);
	fa[0] = 1; for (int i = 1; i < N; i++) fa[i] = fa[i - 1] * i % MOD;
	fi[N - 1] = mi(fa[N - 1]); for (int i = N - 2; i >= 0; i--) fi[i] = fi[i + 1] * (i + 1) % MOD;
}
