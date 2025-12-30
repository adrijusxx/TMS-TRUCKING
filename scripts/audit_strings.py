import os
import re
import json
from difflib import SequenceMatcher

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

def extract_strings(directory):
    # Regex for JSX text content: >  Start, then capture anything not < or { until <
    jsx_text_pattern = re.compile(r'>\s*([^<{]+?)\s*<')
    # Regex for common UI attributes
    attr_pattern = re.compile(r'\b(placeholder|title|aria-label|label|heading|description|alt)\s*=\s*["\']([^"\']+)["\']')
    
    found_strings = {}

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Find JSX text
                        for match in jsx_text_pattern.finditer(content):
                            text = match.group(1).strip()
                            if len(text) > 2 and not text.startswith('{'): # filtering basics
                                if text not in found_strings:
                                    found_strings[text] = []
                                found_strings[text].append(path)

                        # Find Attributes
                        for match in attr_pattern.finditer(content):
                            text = match.group(2).strip()
                            if len(text) > 2:
                                if text not in found_strings:
                                    found_strings[text] = []
                                found_strings[text].append(path)
                except Exception as e:
                    print(f"Error reading {path}: {e}")

    return found_strings

def analyze_similarity(strings_dict):
    unique_strings = list(strings_dict.keys())
    # Optimization: Sort by length
    unique_strings.sort(key=len)
    
    groups = []
    processed = set()
    
    # Create length buckets to avoid N^2
    buckets = {}
    for s in unique_strings:
        l = len(s)
        if l not in buckets: buckets[l] = []
        buckets[l].append(s)

    for i in range(len(unique_strings)):
        s1 = unique_strings[i]
        if s1 in processed:
            continue
        
        current_group = {
            "primary": s1,
            "count": len(strings_dict[s1]),
            "locations": strings_dict[s1],
            "similar": []
        }
        
        has_similar = False
        l1 = len(s1)
        
        # Check buckets l1-2 to l1+2
        candidates = []
        for l in range(max(1, l1-2), l1+3):
            if l in buckets:
                candidates.extend(buckets[l])
                
        for s2 in candidates:
            if s1 == s2 or s2 in processed:
                continue
            
            # Optimization: Quick ratio check using set intersection of words
            # This filters out completely different strings before expensive SequenceMatcher
            # set1 = set(s1.lower().split())
            # set2 = set(s2.lower().split())
            # if not set1 & set2: continue 

            similarity_score = similar(s1.lower(), s2.lower())
            
            if similarity_score >= 0.85: # Slightly higher threshold for stricter matching
                current_group["similar"].append({
                    "text": s2,
                    "score": round(similarity_score, 2),
                    "count": len(strings_dict[s2]),
                    "locations": strings_dict[s2]
                })
                processed.add(s2)
                has_similar = True
        
        processed.add(s1)
        
        if has_similar or current_group["count"] > 1:
            groups.append(current_group)
            
    return groups, unique_strings

def main():
    target_dir = r"c:\Users\Adrian\Documents\GITHUB-PROJECTS\TMS-TRUCKING\components"
    print(f"Scanning {target_dir}...")
    
    strings_map = extract_strings(target_dir)
    print(f"Found {len(strings_map)} unique strings.")
    
    groups, all_strings = analyze_similarity(strings_map)
    
    # Filter for interesting groups (where similar text exists)
    interesting_groups = sorted(groups, key=lambda x: len(x['similar']), reverse=True)
    
    output = {
        "groups": interesting_groups,
        "total_unique": len(all_strings),
        "top_frequent": sorted(
            [{"text": k, "count": len(v)} for k, v in strings_map.items()], 
            key=lambda x: x['count'], 
            reverse=True
        )[:50]
    }
    
    with open('scripts/audit_results.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)
        
    print(f"Results written to scripts/audit_results.json")

if __name__ == "__main__":
    main()
