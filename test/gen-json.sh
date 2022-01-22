#!/usr/bin/env bash

pushd "$( dirname "${BASH_SOURCE[0]}" )" || exit 1;

find_package() {
  find . -mindepth 2 -maxdepth 2 -type f -iname 'package.json'
}

find_entrypoints() {
  find . -mindepth 2 -maxdepth 2 -type f -iname 'index.ts'
}

git_status() {
  git status --short .
}


throw() { echo -e "[-] Fatal: $1" >&2; exit 1; }
realpath() { echo "$(cd "$(dirname "$1")"; pwd -P)/$(basename "$1")"; }
# https://stackoverflow.com/questions/2875424/correct-way-to-check-for-a-command-line-flag-in-bash
has_param() {
    local term="$1"
    shift
    for arg; do
        if [[ $arg == "$term" ]]; then
            return 0
        fi
    done
    return 1
}

if has_param "--install" "${@}"; then
  while read -r file; do
    dir="$(dirname "$file")";
    pushd "$dir" || exit 1;
    echo "[.] Installing packages for '$dir'";
    npm install || throw "Install package failed!";
    popd || exit 1;
  done <<< "$(find_package)"
fi

while read -r file; do
  echo "[.] Executing '$file'";
  file="$(realpath "$file")";
  if has_param "--silent" "${@}"; then
    npm run ts -- "${file}" >/dev/null || throw "Test failed!";
  else
    npm run ts -- "${file}" || throw "Test failed!";
  fi
done <<< "$(find_entrypoints)"

if has_param "--ci" "${@}"; then
  echo "[.] git status";
  git_status;
  test -n "$(git_status)" && throw "Somethings changed";
fi

echo "[+] Done!"
