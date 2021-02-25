const MAX_SIZE = 0x2598;

const START_ADDRESS = {
  us: 0x02330134,
  eu: 0x02330B74,
};
const JUMP_ADDRESS = {
  us: 0x023326CC,
  eu: 0x0233310C,
};

export function insertCodeIntoTemplate(context, region, r10ReturnValue) {
  return `; Template based on https://github.com/irdkwia/eos-move-effects/blob/master/template.asm
.relativeinclude on
.nds
.arm

.definelabel MaxSize, 0x${MAX_SIZE.toString(16)}

.include "lib/stdlib_${region}.asm"
.include "lib/dunlib_${region}.asm"
.definelabel MoveStartAddress, 0x${START_ADDRESS[region].toString(16)}
.definelabel MoveJumpAddress, 0x${JUMP_ADDRESS[region].toString(16)}

; File creation
.create "./code_out.bin", 0x${START_ADDRESS[region].toString(16)}
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
  .endarea
.close
`;
}