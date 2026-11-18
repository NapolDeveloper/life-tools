#!/usr/bin/env python3
"""
사이트에서 실제로 쓰는 글자만 담은 단일 가변 서브셋 woff2(Donsem Subset)를 만든다.
- 원본: node_modules/pretendard/dist/public/variable/PretendardVariable.ttf (SIL OFL 1.1)
- 굵기 축을 400~700으로 제한(사이트는 400·600·700만 사용)하고, src/ 와 docs 외 글자 중 한글 완성형·ASCII·일반 문장부호만 남긴다.
- OFL의 예약 글꼴 이름(Pretendard) 조항을 피하려고 name 테이블을 "Donsem Subset"으로 바꾼다(저작권 문구는 유지).
- 서브셋에 없는 글자는 기존 Pretendard 동적 서브셋(@font-face)이 이어서 맡는다.
출력: public/fonts/donsem-subset.woff2, src/styles/subset-range.css(@font-face), 사용 글자 수 요약.
의존: pip install fonttools brotli
"""
import glob, re, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

SRC = 'node_modules/pretendard/dist/public/variable/PretendardVariable.ttf'
chars = set(chr(c) for c in range(0x20, 0x7f))
for f in glob.glob('src/**/*', recursive=True) + glob.glob('docs/**/*.md', recursive=True):
    try:
        text = open(f, encoding='utf-8').read()
    except Exception:
        continue
    for ch in text:
        o = ord(ch)
        if 0xAC00 <= o <= 0xD7A3 or 0x20 <= o <= 0x7e or ch in '·…“”‘’–—×÷−→←↑↓※○●■□▲▼◆◇★☆₩ⓒ©®™°±≈≠≤≥∼~·ㆍ':
            chars.add(ch)
font = TTFont(SRC)
font = instancer.instantiateVariableFont(font, {'wght': (400, 700)})
opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['kern', 'locl', 'tnum', 'ccmp', 'liga', 'calt']
opts.notdef_outline = True
opts.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
sub = subset.Subsetter(opts)
sub.populate(unicodes=[ord(c) for c in chars])
sub.subset(font)
name = font['name']
for rec in name.names:
    if rec.nameID in (1, 16):
        rec.string = 'Donsem Subset'
    elif rec.nameID in (4, 6, 18):
        rec.string = 'Donsem-Subset'
    elif rec.nameID == 3:
        rec.string = 'Donsem-Subset-derived-from-Pretendard'
font.flavor = 'woff2'
font.save('public/fonts/donsem-subset.woff2')

cps = sorted(ord(c) for c in chars)
ranges, start, prev = [], cps[0], cps[0]
for c in cps[1:]:
    if c != prev + 1:
        ranges.append((start, prev)); start = c
    prev = c
ranges.append((start, prev))
rng = ', '.join(f'U+{a:x}' if a == b else f'U+{a:x}-{b:x}' for a, b in ranges)
css = ("/* 자동 생성: scripts/subset-fonts.py. 직접 수정하지 말 것. 사이트에서 쓰는 글자만 담은 단일 가변 서브셋(Pretendard 파생, SIL OFL 1.1) */\n"
       "@font-face {\n\tfont-family: 'Donsem Subset';\n\tfont-style: normal;\n\tfont-display: swap;\n\tfont-weight: 400 700;\n"
       "\tsrc: url(/fonts/donsem-subset.woff2) format('woff2');\n\tunicode-range: " + rng + ";\n}\n")
open('src/styles/subset-range.css', 'w').write(css)
import os
print(len(chars), 'chars', os.path.getsize('public/fonts/donsem-subset.woff2'), 'bytes')
