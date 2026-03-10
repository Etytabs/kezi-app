{ pkgs, ... }: {

  channel = "stable-24.05";

  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.nodemon
    pkgs.postgresql_16
    pkgs.git
  ];

  env = {
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/kezi";
  };

}