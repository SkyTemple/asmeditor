export default {
  friendlyName: 'EoS move effect',

  maxSize: 0x2598,

  startAddress: {
    us: 0x02330134,
    eu: 0x02330B74,
  },
  jumpAddress: {
    us: 0x023326CC,
    eu: 0x0233310C,
  },

  registerTypes: {
    'user': 'r9',
    'target': 'r4',
    'moveData': 'r8'
  }
}
