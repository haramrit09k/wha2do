// Single source of truth for colours, spacing and type so every screen matches.
export const colors = {
  primary: '#4154FE',
  primaryDark: '#2F3FD8',
  primarySoft: '#E8EBFF',
  bg: '#F4F7FF',
  surface: '#FFFFFF',
  ink: '#1B1F3B',
  muted: '#6B7390',
  line: '#E3E7F5',
  success: '#1FA971',
  successSoft: '#E1F6EC',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
};

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const shadow = {
  shadowColor: '#2A3170',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 4,
};

export const type = {
  title: { fontSize: 30, fontWeight: '800', color: colors.ink },
  heading: { fontSize: 20, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.ink },
  caption: { fontSize: 13, color: colors.muted },
};
