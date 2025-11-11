import json
import re
import os

def parse_level_file(file_path, level_num):
    """텍스트 파일을 파싱하여 JSON 형식으로 변환"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 실제 이미지 파일 목록 가져오기
    img_dir = f"img/level{level_num}"
    actual_images = []
    if os.path.exists(img_dir):
        actual_images = sorted([f for f in os.listdir(img_dir) if f.endswith('.png')])
    
    # 경고등 항목들을 분리
    # "경고이름:" 패턴으로 시작하는 항목들을 찾음
    pattern = r'경고이름:\s*(.+?)\n발생원인:\s*(.+?)\n대응방법:\s*(.+?)(?=\n\n경고이름:|$)'
    matches = re.findall(pattern, content, re.DOTALL)
    
    warnings = []
    for i, match in enumerate(matches, 1):
        name = match[0].strip()
        cause = match[1].strip()
        solution = match[2].strip()
        
        # 실제 이미지 파일명 사용 (인덱스 기반)
        img_filename = actual_images[i-1] if i <= len(actual_images) else None
        
        if img_filename:
            image_path = f"img/level{level_num}/{img_filename}"
        else:
            # 이미지 파일이 없으면 기본 형식으로 생성
            if level_num == 1:
                img_filename = f"{i:02d}_{name.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')}.png"
            else:
                img_filename = f"{i:03d}_{name.replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')}.png"
            image_path = f"img/level{level_num}/{img_filename}"
        
        warnings.append({
            "id": i,
            "name": name,
            "cause": cause,
            "solution": solution,
            "image": image_path
        })
    
    return warnings

def main():
    # 각 레벨 파일을 파싱
    all_data = {}
    
    for level in range(1, 5):
        file_path = f"text/level{level}.txt"
        if os.path.exists(file_path):
            warnings = parse_level_file(file_path, level)
            all_data[f"level{level}"] = warnings
            print(f"Level {level}: {len(warnings)} items parsed")
    
    # JSON 파일로 저장
    output_file = "data/warnings.json"
    os.makedirs("data", exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nJSON file created: {output_file}")
    print(f"Total items: {sum(len(v) for v in all_data.values())}")

if __name__ == "__main__":
    main()

