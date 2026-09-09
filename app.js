if(key==='type'){
            return `<td><select data-field="type" style="width:100%;height:100%;border:none;padding:6px 8px;">
              <option value="가맹점" ${s.type==='가맹점'?'selected':''}>가맹점</option>
              <option value="직영점" ${s.type==='직영점'?'selected':''}>직영점</option>
            </select></td>`;
          }
          // --- 여기서부터 아래 5줄을 복사해서 붙여넣으세요 ---
          if(key==='status'){
            return `<td><select data-field="status" style="width:100%;height:100%;border:none;padding:6px 8px;">
              <option value="운영" ${s.status!=='폐업'?'selected':''}>운영</option>
              <option value="폐업" ${s.status==='폐업'?'selected':''}>폐업</option>
            </select></td>`;
          }
          // ---------------------------------------------