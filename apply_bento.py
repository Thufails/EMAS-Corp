import re
import sys

def apply_bento(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Bento pattern classes to cycle through
    pattern = [
        'col-span-2 row-span-2', # large block
        '',                      # regular block
        '',                      # regular block
        'col-span-2',            # wide block
        '',                      # regular block
        'row-span-2',            # tall block
        '',                      # regular block
        ''                       # regular block
    ]

    div_regex = re.compile(r'          <div class=\"group relative overflow-hidden rounded-2xl fade-in-up cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300\">')
    
    count = 0
    def inject_class(m):
        nonlocal count
        extra = pattern[count % len(pattern)]
        count += 1
        if extra:
            return f'          <div class=\"{extra} group relative overflow-hidden rounded-2xl fade-in-up cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300\">'
        return m.group(0)
        
    new_content = div_regex.sub(inject_class, content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)

apply_bento('C:/xampp1/htdocs/DEMO-main 22/galeri-food.html')
apply_bento('C:/xampp1/htdocs/DEMO-main 22/galeri.html')
print('Done!')
