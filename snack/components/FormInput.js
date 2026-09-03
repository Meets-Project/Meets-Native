import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { maskCPF, maskDate, maskPhone, maskTime } from '../utils/masks';

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  mask, // 'date' | 'time' | 'phone' | 'cpf'
  required = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  leftIcon,
  editable = true,
  maxLength,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text) => {
    let formatted = text;
    if (mask === 'date') formatted = maskDate(text);
    else if (mask === 'time') formatted = maskTime(text);
    else if (mask === 'phone') formatted = maskPhone(text);
    else if (mask === 'cpf') formatted = maskCPF(text);
    onChangeText?.(formatted);
  };

  const hasError = !!error;
  const isSecure = secureTextEntry && !showPassword;

  // Resolve keyboard type if mask is provided
  let computedKeyboardType = keyboardType;
  if (mask === 'date' || mask === 'time' || mask === 'phone' || mask === 'cpf') {
    computedKeyboardType = 'numeric';
  }

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredStar}> *</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          !editable && styles.inputDisabled,
          multiline && { minHeight: 90, alignItems: 'flex-start' },
        ]}
      >
        {leftIcon ? (
          <MaterialCommunityIcons
            name={leftIcon}
            size={20}
            color={hasError ? '#d93025' : isFocused ? colors.primary : colors.textMuted}
            style={styles.leftIcon}
          />
        ) : null}

        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#9a9a9a"
          secureTextEntry={isSecure}
          keyboardType={computedKeyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            inputStyle,
          ]}
          {...rest}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.rightAction}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Exibir senha'}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}

        {hasError && !secureTextEntry ? (
          <View style={styles.rightAction}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#d93025" />
          </View>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorRow}>
          <MaterialCommunityIcons name="alert-circle" size={14} color="#d93025" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  requiredStar: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#fffcfb',
  },
  inputError: {
    borderColor: '#d93025',
    borderWidth: 1.5,
    backgroundColor: '#fff8f7',
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    opacity: 0.7,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  rightAction: {
    padding: 6,
    marginLeft: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#d93025',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    paddingHorizontal: 2,
  },
});
