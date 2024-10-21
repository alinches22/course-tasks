Name:           file_count
Version:        1.0
Release:        1%{?dist}
Summary:        Bash скрипт для підрахунку файлів у /etc

License:        GPL
Source0:        %{name}-%{version}.tar.gz

%description
Цей пакет містить Bash скрипт, що рахує файли у директорії /etc.

%prep
%setup -q

%build

%install
mkdir -p %{buildroot}/usr/local/bin
install -m 755 file_count.sh %{buildroot}/usr/local/bin/file_count.sh

%files
/usr/local/bin/file_count.sh

%changelog
* Mon Oct 21 2024 Your Name <aaliinkaa488@gmail.com> - 1.0-1
- Initial package
