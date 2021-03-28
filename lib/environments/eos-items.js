export default {
  friendlyName: 'EoS item effect',

  maxSize: 0xCC4,

  startAddress: {
    us: 0x0231BE50,
    eu: 0x0231C8B0,
  },
  jumpAddress: {
    us: 0x0231CB14,
    eu: 0x0231D574,
  },

  registerTypes: {
    'user': 'r8',
    'target': 'r7',
    'itemData': 'r6'
  }
}
