template<int MOD>
struct Z {
    int x;
    Z (int x = 0) : x(x % MOD) {};

    Z operator+ (Z o) const { return x + o.x; }
    Z operator- (Z o) const { return x - o.x; }
    Z operator* (Z o) const { return x * o.x; }
    Z operator/ (Z o) const { return *this * o.inv(); }

    Z& operator+= (Z o) { return *this = *this + o; }
    Z& operator-= (Z o) { return *this = *this - o; }
    Z& operator*= (Z o) { return *this = *this * o; }
    Z& operator/= (Z o) { return *this = *this / o; }

    Z pow (int b) const { return b == 0 ? 1 : Z(x * x).pow(b / 2) * (b % 2 ? x : 1); }
    Z inv () const { return pow(MOD - 2); }

    friend ostream& operator<< (ostream& out, Z a) {
        return out << (a.x + MOD) % MOD;
    }
};