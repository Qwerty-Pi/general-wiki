int dp[N], C[N], st[N], d[N];
pair<int, int> calc() {
    int h = 1, t = 1;
    dp[0] = 0; st[1] = 1; d[1] = 0;
    for (int i = 1; i <= n; i++) {
        while (h < t && st[h + 1] <= i) h++;
        dp[i] = dp[d[h]] + f(d[h], i) + c;
        C[i] = C[d[h]] + 1;
        while (h < t && dp[i] + f(i, st[t]) <= dp[d[t]] + f(d[t], st[t]))
            --t;
        int l = i + 1, r = n + 1;
        while (l < r) {
            int mid = l + r >> 1;
            if (dp[i] + f(i, mid) <= dp[d[t]] + f(d[t], mid)) 
                r = mid;
            else
                l = mid + 1;
        }
        if (l <= n) {
            t++, d[t] = i, st[t] = l;
        }
    }
    return {dp[n], C[n]};
}

