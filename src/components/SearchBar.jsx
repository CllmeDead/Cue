import { forwardRef } from 'react';

const SearchBar = forwardRef(function SearchBar({ value, onChange, onKeyDown, placeholder }, ref) {
    return (
        <input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent text-[15px] text-cue-text placeholder:text-cue-text-dim outline-none"
        />
    );
});
export default SearchBar;