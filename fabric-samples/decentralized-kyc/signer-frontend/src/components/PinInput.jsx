import { useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

// A row of single-digit boxes instead of a plain password field — reinforces
// that this is a distinct short PIN, not a password, and matches the
// OTP-style input people already know from banking/2FA flows.
//
// value/onChange work with a plain string (e.g. "1234"), same as a normal
// controlled TextField, so it drops into existing PIN state without changes
// elsewhere. Trailing empty boxes just contribute nothing to the string, so
// a 4-digit PIN in a 6-box layout still comes out as "1234".
export default function PinInput({ value = '', onChange, length = 6, disabled, autoFocus, error }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const commit = (nextDigits) => onChange(nextDigits.join(''));

  const handleChange = (i, raw) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[i] = digit;
    commit(next);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(Array.from({ length }, (_, i) => pasted[i] || ''));
    const focusIndex = Math.min(pasted.length, length - 1);
    refs.current[focusIndex]?.focus();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {digits.map((d, i) => (
        <TextField
          key={i}
          inputRef={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          error={error}
          autoFocus={autoFocus && i === 0}
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
            maxLength: 1,
            'aria-label': `PIN digit ${i + 1} of ${length}`,
            sx: { textAlign: 'center', fontSize: 20, fontWeight: 700, py: 1.25, width: 20 },
          }}
        />
      ))}
    </Box>
  );
}
