template<class T>
struct matrix : vector<vector<T>> {
	int n, m; T det;
	int rk; vector<int> pivot, var;

	matrix (int n, int m) : n(n), m(m), vector<vector<T>>(n, vector<T>(m)) {};

	void print() {
		for (auto r : *this) {
			for (auto x : r) cout << x << ' ';
			cout << '\n';
		}
		cout << '\n';
	}

	void echelon_form() {
		rk = 0; det = 1;
		pivot = vector<int>(m, -1); var = vector<int>(n, -1);
		auto& a = *this;
		for (int c = 0; c < m && rk < n; c++) {
			int r0 = rk;
			for (int r = rk + 1; r < n; r++) {
				if (a[r][c] != 0) r0 = r;
			}
			if (r0 != rk) {
				a[r0].swap(a[rk]);
				det *= -1;
			}
			if (a[rk][c] == 0) continue;
			var[rk] = c; pivot[c] = rk;
			T d = a[rk][c], di = T(1) / d; det *= d;
			for (int j = 0; j < m; j++)
				a[rk][j] *= di;
			for (int r = 0; r < n; r++) {
				if (r == rk) continue;
				T d = a[r][c];
				for (int j = 0; j < m; j++)
					a[r][j] -= a[rk][j] * d;
			}
			det *= a[rk++][c];
		}
		det *= rk == max(n, m);
	}

	void augment(const vector<T>& b) {
		assert(n == b.size()); ++m;
		for (int i = 0; i < n; i++) {
			auto& v = (*this)[i];
			v.resize(m); v[m - 1] = b[i];
		}
	}

	vector<T> solve_right(const vector<T>& b) {
		augment(b); echelon_form(); --m;
		if (pivot[m] != -1) return {};
		vector<T> x(m);
		for (int i = 0; i < rk; i++) {
			x[var[i]] = (*this)[i][m];
		}
		return x;
	}

	vector<vector<T>> right_kernel() {
		echelon_form();
		vector<vector<T>> ker;
		for (int c = 0; c < m; c++) {
			if (pivot[c] == -1) {
				vector<T> b(m); b[c] = -1;
				for (int r = 0; r < rk; r++) {
					assert(var[r] != -1);
					b[var[r]] = (*this)[r][c];
				}
				ker.push_back(b);
			}
		}
		return ker;
	}

	friend matrix operator* (const matrix& A, const matrix& B) {
		assert(A.m == B.n); matrix C(A.n, B.m);
		for (int i = 0; i < A.n; i++)
			for (int j = 0; j < B.n; j++)
				for (int k = 0; k < B.m; k++)
					C[i][k] += A[i][j] * B[j][k];
		return C;
	}

	matrix inverse() const {
		assert(n == m); matrix A(n, n * 2);
		for (int i = 0; i < n; i++) {
			for (int j = 0; j < n; j++) {
				A[i][j] = (*this)[i][j];
				A[i][j + n] = i == j;
			}
		}
		A.echelon_form();
		if (A.var[n - 1] >= n) {
			return matrix(0, 0);
		}
		matrix B(n, n);
		for (int i = 0; i < n; i++) {
			for (int j = 0; j < n; j++) {
				B[i][j] = A[i][j + n];
			}
		}
		return B;
	}
};