count_files() {
  local dir=$1
  echo "Рахуємо файли у $dir, виключаючи каталоги та символьні посилання..."
  file_count=$(find "$dir" -type f | wc -l)
  echo "Знайдено $file_count файлів у $dir."
}
