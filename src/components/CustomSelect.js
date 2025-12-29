import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const CustomSelect = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Select an option',
  label = '',
  required = false,
  icon = null,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedOption = options.findIndex(opt => 
        (typeof opt === 'string' ? opt : opt.value) === value
      );
      if (selectedOption >= 0 && dropdownRef.current.children[selectedOption]) {
        dropdownRef.current.children[selectedOption].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [isOpen, value, options]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    setHighlightedIndex(-1);
  };

  const handleSelect = (optionValue, optionLabel) => {
    onChange({ target: { value: optionValue, name: 'select' } });
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          handleSelect(optionValue, optionLabel);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const selectedOption = options.find(opt => 
    (typeof opt === 'string' ? opt : opt.value) === value
  );
  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
    : placeholder;

  return (
    <div className={`custom-select-wrapper ${className}`} ref={selectRef}>
      {label && (
        <label className="custom-select-label">
          {icon && <i className={icon}></i>}
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div 
        className={`custom-select ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="custom-select-dropdown"
        aria-haspopup="listbox"
      >
        <span className="custom-select-value">
          {displayValue}
        </span>
        <i className={`fas fa-chevron-down custom-select-arrow ${isOpen ? 'rotated' : ''}`}></i>
      </div>
      {isOpen && (
        <div className="custom-select-dropdown" ref={dropdownRef} id="custom-select-dropdown" role="listbox">
          {options.length === 0 ? (
            <div className="custom-select-option no-options">No options available</div>
          ) : (
            options.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionLabel = typeof option === 'string' ? option : option.label;
              const isSelected = optionValue === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={optionValue}
                  className={`custom-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  onClick={() => handleSelect(optionValue, optionLabel)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="option-label">{optionLabel}</span>
                  {isSelected && <i className="fas fa-check option-check"></i>}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;





