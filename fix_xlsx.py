import re

with open('frontend/resources/MultiTab_XLSX_Export_Engine.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix SPT logic
spt_fix = """  if (sptData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(sptData);
    XLSX.utils.book_append_sheet(wb, ws2, "SPT_Records");
  }"""
content = content.replace('  const ws2 = XLSX.utils.json_to_sheet(sptData);\n  XLSX.utils.book_append_sheet(wb, ws2, "SPT_Records");', spt_fix)

# Fix Atterberg logic
content = content.replace('if (properties.atterberg_test_data) {', 'if (properties.atterberg_test_data && properties.atterberg_test_data.length > 0) {')

# Fix Consolidation logic
content = content.replace('if (properties.consolidation_test_data) {', 'if (properties.consolidation_test_data && properties.consolidation_test_data.length > 0) {')

with open('frontend/resources/MultiTab_XLSX_Export_Engine.js', 'w', encoding='utf-8') as f:
    f.write(content)
