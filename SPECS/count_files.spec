Name:           count_files
Version:        1.0
Release:        1%{?dist}
Summary:        Count files in /etc

License:        GPL
Source0:        %{name}.sh

%description
This script counts the number of files in the /etc directory.

%prep

%build

%install
install -m 0755 %{SOURCE0} %{buildroot}/usr/local/bin/count_files.sh

%files
/usr/local/bin/count_files.sh

%changelog
* Thu Oct 21 2024 Alinches22 <alinches22@example.com> - 1.0-1
- Initial release.
