#include <bits/stdc++.h>
#define int long long
#define all(a) begin(a), end(a)
#define sz(a) (int) (a).size()
#define rep(i, j, k) for (int i = j; i < k; i++)

using namespace std;

const int MOD = (119 << 23) + 1, root = 62; // = 998244353
// For p < 2^30 there is also e.g. 5 << 25, 7 << 26, 479 << 21
// and 483 << 21 (same root). The last two are > 10^9.

int pm(int b, int e) {
	ll ans = 1;
	for (; e; b = b * b % MOD, e /= 2)
		if (e & 1) ans = ans * b % MOD;
	return ans;
}

int mi(int b) {
    return pm(b, MOD - 2);
}

struct poly : vector<int> {
	using vector::vector;

	poly& norm() {
		for (int& x : *this) x = (x % MOD + MOD) % MOD;
		return *this;
	}

	poly& operator+= (const poly& o) {
		resize(max(size(), o.size()));
		for (int i = 0; i < o.size(); i++) at(i) += o[i];
		return this->norm();
	}

	poly& operator-= (const poly& o) {
		resize(max(size(), o.size()));
		for (int i = 0; i < o.size(); i++) at(i) -= o[i];
		return this->norm();
	}

	poly operator+ (const poly& o) const { poly t = *this; return t += o; }
	poly operator- (const poly& o) const { poly t = *this; return t -= o; }
	poly operator- () const { return poly{0} - *this; }

	poly& ntt() {
		poly& a = *this;
		while (__builtin_popcount(sz(a)) != 1) a.push_back(0);
		int n = sz(a), L = 31 - __builtin_clz(n);
		static vector<ll> rt(2, 1);
		for (static int k = 2, s = 2; k < n; k *= 2, s++) {
			rt.resize(n);
			ll z[] = {1, pm(root, MOD >> s)};
			rep(i,k,2*k) rt[i] = rt[i / 2] * z[i & 1] % MOD;
		}
		vector<int> rev(n);
		rep(i,0,n) rev[i] = (rev[i / 2] | (i & 1) << L) / 2;
		rep(i,0,n) if (i < rev[i]) ::swap(a[i], a[rev[i]]);
		for (int k = 1; k < n; k *= 2)
			for (int i = 0; i < n; i += 2 * k) rep(j,0,k) {
				ll z = rt[j + k] * a[i + j + k] % MOD, &ai = a[i + j];
				a[i + j + k] = ai - z + (z > ai ? MOD : 0);
				ai += (ai + z >= MOD ? z - MOD : z);
			}
		return *this;
	}

	poly& intt() {
		reverse(begin() + 1, end());
		int n = size(), inv = pm(n, MOD - 2);
		for (int i = 0; i < n; i++)
			at(i) = at(i) * inv % MOD;
		return ntt();
	}

	friend poly operator* (const poly& a, const poly& b) {
		if (a.empty() || b.empty()) return {};
		int s = sz(a) + sz(b) - 1, B = 32 - __builtin_clz(s),
			n = 1 << B;
		int inv = pm(n, MOD - 2);
		poly L(a), R(b), out(n);
		L.resize(n), R.resize(n);
		L.ntt(); R.ntt();
		for (int i = 0; i < n; i++) out[i] = L[i] * R[i] % MOD;
		out.intt();
		return {out.begin(), out.begin() + s};
	}

	friend ostream& operator<< (ostream& out, poly P) {
		for (int x : P) out << x << ' ';
		return out << '\n';
	}

	poly mod_xk(int k) const {
		return poly{begin(), begin() + min((int) size(), k)};
	}

	poly div_xk(int k) const {
		return poly{begin() + min((int) size(), k), end()};
	}

	poly mul_xk(int k) const {
		poly Q(k); Q.insert(Q.end(), begin(), end());
		return Q;
	}

	poly recp(int N) const {
		poly Q {mi(at(0))};
		for (int k = 1; k < N; k <<= 1) {
			Q = ((poly{2} - mod_xk(k * 2) * Q) * Q).mod_xk(k * 2);
		}
		return Q.mod_xk(N);
	}

	poly deriv() const {
		if (empty()) return {};
		poly Q((int) size() - 1);
		for (int k = 1; k < size(); k++) {
			Q[k - 1] = at(k) * k % MOD;
		}
		return Q;
	}

	poly integr() const {
		poly Q((int) size() + 1);
		for (int i = 0; i < size(); i++) {
			Q[i + 1] = at(i) * mi(i + 1) % MOD;
		}
		return Q;
	}

	poly log(int N) const {
		return (deriv() * recp(N)).integr().mod_xk(N);
	}

	poly exp(int N) const {
		poly Q {1};
		for (int k = 1; k < N; k <<= 1) {
			Q = ((poly{1} - Q.log(k * 2) + mod_xk(k * 2)) * Q).mod_xk(k * 2);
		}
		return Q.mod_xk(N);
	}

	poly rev() const {
		return {rbegin(), rend()};
	}

	pair<poly, poly> divmod (const poly& Q) const {
		if (size() < Q.size()) return {{0}, *this};
		int n = size(), m = Q.size();
		poly R = (rev() * Q.rev().recp(n - m + 1)).mod_xk(n - m + 1);
		return {R, (*this - Q * R).mod_xk(m - 1)};
	}

	poly operator/ (const poly& Q) const {
		return divmod(Q).first;
	}

	poly operator% (const poly& Q) const {
		return divmod(Q).second;
	}

	poly filter(int m, int r) const {
		poly Q;
		for (int i = r; i < size(); i += m) {
			Q.push_back(at(i));
		}
		return Q;
	}

	poly even() const { return filter(2, 0); }

	poly odd() const { return filter(2, 1); }

	poly alt() const {
		poly Q(size());
		for (int i = 0; i < size(); i++) {
			Q[i] = (MOD + at(i) * (i % 2 == 0 ? 1 : -1)) % MOD;
		}
		return Q;
	}

	friend poly pow(const poly& a, int b, const poly& m) {
		if (b == 0) return {1};
		return pow(a * a, b / 2, m) * (b % 2 ? a : poly{1}) % m;
	}

	poly borel() const {
		poly Q = *this; int mul = 1, inv = 1;
		for (int k = 1; k < size(); k++) mul = mul * k % MOD;
		inv = mi(mul);
		for (int k = (int) size() - 1; k >= 0; k--) {
			Q[k] = at(k) * inv % MOD;
			if (k) inv = inv * k % MOD;
		}
		return Q;
	}

	poly laplace() const {
		poly Q = *this; int mul = 1;
		for (int k = 0; k < size(); k++) {
			Q[k] = at(k) * mul % MOD;
			mul = mul * (k + 1) % MOD;
		}
		return Q;
	}
};

