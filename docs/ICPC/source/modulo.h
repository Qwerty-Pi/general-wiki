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