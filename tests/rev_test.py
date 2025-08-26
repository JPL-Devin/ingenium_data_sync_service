import time
from datetime import datetime

encodeTable = "-_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

decodeTable = [
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  #   0 - 15
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  #  16 - 31
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, 0, -1, -1,  #  32 - 47
  54, 55, 56, 57, 58, 59, 60, 61,
  62, 63, -1, -1, -1, -1, -1, -1,  #  48 - 63
  -1, 2, 3, 4, 5, 6, 7, 8,
  9, 10, 11, 12, 13, 14, 15, 16,  #  64 - 79
  17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, -1, -1, -1, -1, 1,  #  80 - 95
  -1, 28, 29, 30, 31, 32, 33, 34,
  35, 36, 37, 38, 39, 40, 41, 42,  #  96 - 111
  43, 44, 45, 46, 47, 48, 49, 50,
  51, 52, 53, -1, -1, -1, -1, -1,  # 112 - 127
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  # 128 - 143
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  # 144 - 159
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  # 160 - 175
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  # 176 - 191
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  # 192 - 207
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  # 208 - 223
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1,  # 224 - 239
  -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1   # 240 - 255
]

def decodeRev(rev):
    r = 0
    for i in range(11):
      c = decodeTable[ord(rev[i])]
      # print(f'c: {c}')
      r = (r << 6) | c
    
    return r

def test1():
    tns = time.time_ns()
    print(f'tns: {tns} {datetime.utcfromtimestamp(tns/1000000000)}' )

    rev = '_gZvbPKu---'
    ts = decodeRev(rev)
    print(f'rev: {rev}')
    print(f'ts : {ts}  {datetime.utcfromtimestamp(ts/1000000000)}')

    rev = '_gZvbcYu---'
    ts = decodeRev(rev)
    print(f'rev: {rev}')
    print(f'ts : {ts}  {datetime.utcfromtimestamp(ts/1000000000)}')

    rev = '_gZvbtu2---'
    ts = decodeRev(rev)
    print(f'rev: {rev}')
    print(f'ts : {ts}  {datetime.utcfromtimestamp(ts/1000000000)}')   

    # an element
    rev = '_gNnUjje---'
    ts = decodeRev(rev)
    print(f'rev: {rev}')
    print(f'ts : {ts}  {datetime.utcfromtimestamp(ts/1000000000)}')   
    
def test2():
    rev = '-1erpMlX---'
    ts = decodeRev(rev)
    print(f'rev: {rev}')
    print(f'ts : {ts}  {datetime.utcfromtimestamp(ts/1000000000)}')  

    rev = 'GpFGuQH4---'
    ts = decodeRev(rev)
    print(f'rev: {rev}')
    print(f'ts : {ts}  {datetime.utcfromtimestamp(ts/1000000000)}')  

if __name__ == '__main__':
    test1()
    test2()