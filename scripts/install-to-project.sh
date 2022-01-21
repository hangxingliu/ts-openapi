#!/usr/bin/env bash

throw() { echo -e "${red}fatal: ${1}${reset}" >&2; exit 1; }
usage() {
	echo "";
	echo "  Usage: install-to-project.sh <projectDir>";
	echo "";
	echo "         Install this project to the node_modules of a local project";
	echo "";
	exit 0;
}
[[ -t 1 ]] && [[ "$(tput colors)" -ge 8 ]]
if [[ $? == 0 ]]; then red="\x1b[31m"; dim="\x1b[2m" reset="\x1b[0m"; fi

projects=()
for argument in "$@"; do
  case "$argument" in
			-h|--help) usage;;
      *) projects+=("$argument");;
  esac
done

[ "${#projects[@]}" != "1" ] && usage;

projectDir="${projects[0]}";
echo "info: projectDir: $projectDir";
[ -n "$projectDir" ] || throw "projectDir is not a directory!";
[ -d "$projectDir" ] || throw "projectDir is not a directory!";

thisDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )";
[ -d "$thisDir" ] || throw "can't find the directory of this project";

nodeModules="${projectDir}/node_modules";
[ -d "$nodeModules" ] || throw "there is not a node_modules in projectDir!";

if [ ! -d "${nodeModules}/@hangxingliu" ]; then
  echo "info: creating directory '${nodeModules}/@hangxingliu' ...";
  mkdir "${nodeModules}/@hangxingliu" || throw 'create directory failed!';
fi

target="${nodeModules}/@hangxingliu/ts-openapi";
if [ -e "$target" ]; then
  echo "info: target '${target}' is existed, deleting it ...";
  rm -r "${target}" || throw "delete failed!";
fi

echo "info: ln -s ${thisDir} ${target} ...";
ln -s "${thisDir}" "${target}" || throw "create symbol link failed!";

echo "done!";
