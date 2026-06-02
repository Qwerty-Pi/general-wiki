struct DSU {
	vector<int> p;
	DSU (int n) : p(n) { iota(all(p), 0); }
	int f(int x) { return p[x] == x ? x : p[x] = f(p[x]); }
	void g(int x, int y) { p[f(x)] = f(y); }
};
