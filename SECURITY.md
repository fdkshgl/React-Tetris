# セキュリティ（デプロイ前チェック）

- **依存関係**: `npm audit` で既知の脆弱性なし。
- **機密情報**: APIキー等の外部サービス連携は行っておらず、フロントに露出する機密はなし。
- **XSS**: `dangerouslySetInnerHTML` / `eval` 等は未使用。表示はReactのテキストとしてエスケープされる。
- **.gitignore**: `.env` / `.env.local` を除外し、誤コミットを防止。
