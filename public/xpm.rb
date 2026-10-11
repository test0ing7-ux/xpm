class Xpm < Formula
  desc "XPM Universal Native Package Manager"
  homepage "https://edvu.in"
  url "https://edvu.in/xpm-macos"
  version "1.0.0"
  sha256 "b60fe2c4f1ec5b3b70e77e9a5196868ebbda43d163f9054ab43e7361990ce946"

  def install
    bin.install "xpm-macos" => "xpm"
    # Create xpx alias helper
    (bin/"xpx").write <<~EOS
      #!/usr/bin/env bash
      exec "#{bin}/xpm" x "$@"
    EOS
  end

  test do
    system "#{bin}/xpm", "--help"
  end
end
