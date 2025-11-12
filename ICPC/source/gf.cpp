#include <bits/stdc++.h>
#define int long long
#define all(a) begin(a), end(a)
#define sz(a) (int) (a).size()
#define rep(i, j, k) for (int i = j; i < k; i++)

using namespace std;

template<int MOD>
struct Z {
	int x;
	Z () { x = 0; };
	Z (int x) { s(x % MOD + MOD); };
	Z& s (int a) { x = a < MOD ? a : a - MOD; return *this; }

	Z& operator+= (Z o) { return s(x + o.x); }
	Z& operator-= (Z o) { return s(x - o.x + MOD); }
	Z& operator*= (Z o) { x = x * o.x % MOD; return *this; }
	Z& operator/= (Z o) { return *this *= o.inv(); }

	Z operator+ (Z o) const { return Z(*this) += o; }
	Z operator- (Z o) const { return Z(*this) -= o; }
	Z operator* (Z o) const { return Z(*this) *= o; }
	Z operator/ (Z o) const { return Z(*this) /= o; }

	bool operator== (Z o) const { return x == o.x; }
	bool operator!= (Z o) const { return x != o.x; }

	Z pow (int b) const { return b == 0 ? 1 : Z(x * x).pow(b / 2) * (b % 2 ? x : 1); }
	Z inv () const { return pow(MOD - 2); }

	friend ostream& operator<< (ostream& out, Z a) {
		return out << a.x;
	}
};

typedef long long ll;
typedef vector<int> vi;
typedef long long LL;

const ll mod = (119 << 23) + 1, root = 62; // = 998244353
// For p < 2^30 there is also e.g. 5 << 25, 7 << 26, 479 << 21
// and 483 << 21 (same root). The last two are > 10^9.

const ll MOD = mod;
using Zn = Z<MOD>;

ll pm(ll b, ll e) {
	ll ans = 1;
	for (; e; b = b * b % mod, e /= 2)
		if (e & 1) ans = ans * b % mod;
	return ans;
}

ll mi(ll b) {
    return pm(b, mod - 2);
}

typedef vector<ll> poly;
typedef vector<ll> vl;

void ntt(vl &a) {
	while (__builtin_popcount(sz(a)) != 1) a.push_back(0);
	int n = sz(a), L = 31 - __builtin_clz(n);
	static vl rt(2, 1);
	for (static int k = 2, s = 2; k < n; k *= 2, s++) {
		rt.resize(n);
		ll z[] = {1, pm(root, mod >> s)};
		rep(i,k,2*k) rt[i] = rt[i / 2] * z[i & 1] % mod;
	}
	vi rev(n);
	rep(i,0,n) rev[i] = (rev[i / 2] | (i & 1) << L) / 2;
	rep(i,0,n) if (i < rev[i]) swap(a[i], a[rev[i]]);
	for (int k = 1; k < n; k *= 2)
		for (int i = 0; i < n; i += 2 * k) rep(j,0,k) {
			ll z = rt[j + k] * a[i + j + k] % mod, &ai = a[i + j];
			a[i + j + k] = ai - z + (z > ai ? mod : 0);
			ai += (ai + z >= mod ? z - mod : z);
		}
}

vl conv(const vl &a, const vl &b) {
	if (a.empty() || b.empty()) return {};
	int s = sz(a) + sz(b) - 1, B = 32 - __builtin_clz(s),
	    n = 1 << B;
	int inv = pm(n, mod - 2);
	vl L(a), R(b), out(n);
	L.resize(n), R.resize(n);
	ntt(L), ntt(R);
	rep(i,0,n)
		out[-i & (n - 1)] = (ll)L[i] * R[i] % mod * inv % mod;
	ntt(out);
	return {out.begin(), out.begin() + s};
}

void intt(poly& a) {
    reverse(1 + all(a));
    ntt(a); int inv = mi(a.size());
    for (int& x : a) x = x * inv % mod;
}

poly operator+ (const poly& a, const poly& b) {
	int s = max(a.size(), b.size());
	poly c(s);
	for (int i = 0; i < a.size(); i++) c[i] += a[i];
	for (int i = 0; i < b.size(); i++) c[i] += b[i];
	for (int& x : c) x = (x % MOD + MOD) % MOD;
	return c;
}

poly operator- (const poly& a, const poly& b) {
	int s = max(a.size(), b.size());
	poly c(s);
	for (int i = 0; i < a.size(); i++) c[i] += a[i];
	for (int i = 0; i < b.size(); i++) c[i] -= b[i];
	for (int& x : c) x = (x % MOD + MOD) % MOD;
	return c;
}

poly operator- (const poly& a) {
	return poly{0} - a;
}

poly operator* (const poly& a, const poly& b) {
    return conv(a, b);
}

poly& operator+= (poly& a, const poly& b) {
	return a = a + b;
}

poly& operator-= (poly& a, const poly& b) {
	return a = a - b;
}

poly& operator*= (poly& a, const poly& b) {
	return a = a * b;
}

ostream& operator<< (ostream& out, poly P) {
	for (int x : P) out << x << ' ';
	return out << '\n';
}

poly mod_xk(int k, const poly& P) {
	return poly{P.begin(), P.begin() + min((int) P.size(), k)};
}

poly mul_xk(int k, const poly& P) {
	poly Q(k); for (int x : P) Q.push_back(x);
	return Q;
}

poly inverse(int N, const poly& P) {
	poly Q {mi(P[0])};
	for (int k = 1; k < N; k <<= 1) {
		Q = mod_xk(k * 2, mod_xk(k * 2, poly{2} - mod_xk(k * 2, P) * Q) * Q);
	}
	return mod_xk(N, Q);
}

poly deriv(const poly& P) {
    if (P.empty()) return {};
    poly Q((int) P.size() - 1);
    for (int k = 1; k < P.size(); k++) {
        Q[k - 1] = P[k] * k % MOD;
    }
    return Q;
}

poly integr(const poly& P) {
    poly Q((int) P.size() + 1);
    for (int i = 0; i < P.size(); i++) {
        Q[i + 1] = P[i] * mi(i + 1) % MOD;
    }
    return Q;
}

poly log(int N, const poly& P) {
    poly Q = deriv(P) * inverse(N, P); Q.resize(N);
    Q = integr(Q); Q.resize(N);
    return Q;
}

poly exp(int N, const poly& P) {
	poly Q {1};
	for (int k = 1; k < N; k <<= 1) {
		Q = mod_xk(k * 2, (poly{1} - log(k * 2, Q) + mod_xk(k * 2, P)) * Q);
	}
	Q.resize(N);
	return Q;
}

pair<poly, poly> divmod (const poly& P, const poly& Q) {
	if (P.size() < Q.size()) return {{0}, P};
	int n = P.size(), m = Q.size();
	poly P_R(P.rbegin(), P.rend()), Q_R(Q.rbegin(), Q.rend());
	poly R = P_R * inverse(n - m + 1, Q_R); R.resize(n - m + 1);
	reverse(all(R));
	poly S = P - Q * R; S.resize(m - 1);
	return {R, S};
}

poly operator/ (const poly& P, const poly& Q) {
	return divmod(P, Q).first;
}

poly operator% (const poly& P, const poly& Q) {
	return divmod(P, Q).second;
}

struct EvalTree {
	int n; vector<int> X;
	vector<poly> T;
	EvalTree(const vector<int>& X) : n(X.size()), X(X) {
		int s = 1; while (s < n) s <<= 1; T.resize(s * 2);
		build(0, 0, n);
	}
	void build(int v, int l, int r) {
		if (l + 1 == r) {
			T[v] = {(MOD - X[l]) % MOD, 1};
		} else {
			int m = (l + r) / 2;
			build(v * 2 + 1, l, m);
			build(v * 2 + 2, m, r);
			T[v] = T[v * 2 + 1] * T[v * 2 + 2];
		}
	}
	vector<int> ans;
	void rec(const poly& P, int v, int l, int r) {
		if (l + 1 == r) {
			ans.push_back((P[0] + (P.size() >= 2 ? P[1] : 0) * X[l]) % MOD);
		} else {
			int m = (l + r) / 2;
			rec(P % T[v * 2 + 1], v * 2 + 1, l, m);
			rec(P % T[v * 2 + 2], v * 2 + 2, m, r);
		}
	}
	vector<int> query(const poly& P) {
		ans.clear();
		rec(P, 0, 0, n);
		return ans;
	}
};

vector<int> eval_multipoint(const poly& P, const vector<int>& X) {
	EvalTree eval_tree(X);
	return eval_tree.query(P);
}

namespace DC_FFT {
	// Given G(x) where [x^0] G(x) = 0 and H(_, _) arbitrary.
	// Solve for F(x) in [x^n] F(x) = H(n, [x^n] F(x) * G(x))
	// Works in O(N log^2 N).
	void rec(poly& F, const poly& G, int (*H) (int, int), int S0, int l, int r) {
		if (l + 1 == r) {
			F[l] = H(l, F[l]);
		} else {
			int m = (l + r) / 2;
			if (m > S0) rec(F, G, H, S0, l, m);
			poly A {F.begin() + l, F.begin() + m};
			poly B = mod_xk(r - l, G) * A;
			for (int i = max(S0, m); i < r; i++) {
				F[i] += i - l < B.size() ? B[i - l] : 0;
				F[i] %= MOD;
			}
			rec(F, G, H, S0, m, r);
		}
	}
	poly solve(int N, const poly& F0, const poly& G, int (*H) (int, int)) {
		poly F(N); for (int i = 0; i < F0.size(); i++) F[i] = F0[i];
		rec(F, G, H, F0.size(), 0, N);
		return F;
	}
};

struct CountMod{
    vector<LL> fa, fi, _mi;
    CountMod(LL N) {
        N += 10; // buffer
        fa = fi = _mi = vector<LL>(N + 1);
        fa[0] = 1; for (LL i = 1; i <= N; i++) fa[i] = fa[i - 1] * i % MOD;
        if (N < MOD) {
            fi[N] = mi(fa[N]); for (LL i = N - 1; i >= 0; i--) fi[i] = fi[i + 1] * (i + 1) % MOD;
        } else {
            for (LL i = 0; i <= N; i++) fi[i] = mi(fa[i]);
        }
        for (LL i = 1; i <= N; i++) _mi[i] = mi(i);
    }
    LL factorial(LL n) {
        return fa[n];
    }
    LL fact_inv(LL n) {
        return fi[n];
    }
    LL inv(LL n) {
        return _mi[n];
    }
    LL binom(LL n, LL k) {
        if (n < 0 || k < 0 || k > n) return 0LL;
        return fa[n] * fi[k] % MOD * fi[n - k] % MOD;
    }
    LL count(vector<LL> a) {
        LL s = accumulate(a.begin(), a.end(), 0LL);
        LL ans = fa[s];
        for (auto x : a) {
            ans *= fi[x]; ans %= MOD;
        }
        return ans;
    }
};

poly borel(const poly& P) {
	poly Q = P; CountMod CM(P.size());
	for (int k = 0; k < Q.size(); k++) {
		(Q[k] *= CM.fact_inv(k)) %= MOD;
	}
	return Q;
}

poly laplace(const poly& P) {
	poly Q = P; CountMod CM(P.size());
	for (int k = 0; k < Q.size(); k++) {
		(Q[k] *= CM.factorial(k)) %= MOD;
	}
	return Q;
}

poly pm(const poly& a, int b, const poly& m) {
	if (b == 0) return {1};
	return pm(a * a % m, b / 2, m) * (b % 2 ? a : poly{1}) % m;
}

poly pick(const poly& P, int m, int r) {
	poly Q;
	for (int i = 0; i < P.size(); i++) {
		if (i % m == r) Q.push_back(P[i]);
	}
	return Q;
}

poly even(const poly& P) {
	return pick(P, 2, 0);
}

poly odd(const poly& P) {
	return pick(P, 2, 1);
}

poly alternate(const poly& P) {
	poly Q(P.size());
	for (int i = 0; i < Q.size(); i++) {
		Q[i] = (MOD + (i % 2 == 0 ? 1 : -1) * P[i]) % MOD;
	}
	return Q;
}

// [X^T] R(X) / S(X)
Zn graeffe(int N, const poly& R, const poly& S) {
	if (N == 0) return R[0] * mi(S[0]) % MOD;
	poly S_n = alternate(S), RS = R * S_n, SS = S * S_n;
	return graeffe(N / 2, N % 2 ? odd(RS) : even(RS), even(SS));
}

void solve() {
	poly F {0, 1};
	poly G {0, 1, 1};
	cout << DC_FFT::solve(10, F, G, [] (int x, int y) { return y; });
}

int32_t main() {
    cin.tie(0)->sync_with_stdio(false);
    int t = 1;
    // cin >> t;
    while (t--) {
        solve();
    }
}