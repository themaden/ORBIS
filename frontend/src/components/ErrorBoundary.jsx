import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Gerçek projede burada bir hata izleme servisine (Sentry vb.) gönderilir
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-command h-screen w-screen flex items-center justify-center text-white">
          <div className="glass rounded-2xl p-8 max-w-md text-center">
            <div className="text-thy text-4xl mb-3">⚠</div>
            <h1 className="text-lg font-semibold mb-2">Bir şeyler ters gitti</h1>
            <p className="text-sm text-white/60 mb-5">
              Uygulamada beklenmeyen bir hata oluştu. Sayfayı yeniden
              yüklemeyi deneyin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-thy hover:bg-red-600 transition text-sm font-medium"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
