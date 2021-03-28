export function insertCodeIntoTemplate(context, region, environment, r10ReturnValue) {
  return `; Template based on https://github.com/irdkwia/eos-move-effects/blob/master/template.asm
.relativeinclude on
.nds
.arm

.definelabel MaxSize, 0x${environment.maxSize.toString(16)}

.include "lib/stdlib_${region}.asm"
.include "lib/dunlib_${region}.asm"
.definelabel MoveStartAddress, 0x${environment.startAddress[region].toString(16)}
.definelabel MoveJumpAddress, 0x${environment.jumpAddress[region].toString(16)}

; File creation
.create "./code_out.bin", 0x${environment.startAddress[region].toString(16)}
  .org MoveStartAddress
  .area MaxSize ; Define the size of the area
    sub r13, r13, #0x${context.stackReserveSize.toString(16)}  

    ; Code here
    ${context.lines.join('\n    ')}
    
  end:
    add r13, r13, #0x${context.stackReserveSize.toString(16)}  
    ${r10ReturnValue ? 'mov r10, #1' : ''}
    b MoveJumpAddress
    .pool

  ; Variables and static arrays
  ${context.dataLines.join('\n  ')}
  .endarea
.close
`;
}
