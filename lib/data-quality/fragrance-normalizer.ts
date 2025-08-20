/**
 * Fragrance Name Normalization Engine
 * Transforms malformed fragrance names into professional, standardized format
 * Addresses Linear issues SCE-49, SCE-50, SCE-51
 */

export interface NormalizationResult {
  canonicalName: string
  fragranceLine: string
  concentration?: string
  needsNormalization: boolean
  changes: string[]
  confidence: number
}

export class FragranceNormalizer {
  // Industry-standard concentration mappings
  private readonly CONCENTRATION_MAP: Record<string, string> = {
    'edp': 'Eau de Parfum',
    'edt': 'Eau de Toilette',
    'edc': 'Eau de Cologne',
    'parfum': 'Extrait de Parfum',
    'extrait': 'Extrait de Parfum',
    'cologne': 'Eau de Cologne',
    'aftershave': 'Aftershave',
    'eau de parfum': 'Eau de Parfum',
    'eau de toilette': 'Eau de Toilette',
    'eau de cologne': 'Eau de Cologne'
  }

  // Known brand aliases for normalization
  private readonly BRAND_ALIASES: Record<string, string> = {
    'ck': 'Calvin Klein',
    'jpg': 'Jean Paul Gaultier', 
    'ysl': 'Yves Saint Laurent',
    'd&g': 'Dolce & Gabbana',
    'dg': 'Dolce & Gabbana',
    'armani': 'Giorgio Armani',
    'prada': 'Prada',
    'versace': 'Versace'
  }

  // Chanel number abbreviations
  private readonly CHANEL_NUMBER_MAP: Record<string, string> = {
    'n05': 'No 5',
    'n19': 'No 19', 
    'n22': 'No 22',
    'n°5': 'No 5',
    'n°19': 'No 19',
    'n°22': 'No 22'
  }

  // Chanel Les Exclusifs collection fragrances
  private readonly CHANEL_EXCLUSIFS = new Set([
    'coromandel', 'sycomore', 'cuir de russie', 'gardénia', 'bel respiro',
    'jersey', 'eau de cologne', 'bois des iles', 'beige', 'misia',
    'les eaux de chanel', 'venice', 'deauville', 'biarritz', 'paris'
  ])

  // Chanel fragrance line completions
  private readonly CHANEL_LINE_COMPLETIONS: Record<string, string> = {
    'bleu de': 'Bleu de Chanel',
    'coco mademoiselle': 'Coco Mademoiselle',
    'chance': 'Chance',
    'allure': 'Allure'
  }

  // Words that should stay capitalized
  private readonly PRESERVE_CAPS = new Set(['USA', 'NYC', 'UK', 'DNA', 'CEO', 'VIP', 'DJ', 'ID', 'CH', 'JPG', 'YSL', 'TF', 'CK'])

  /**
   * Main normalization function
   */
  normalizeFragranceName(originalName: string, brandName?: string): NormalizationResult {
    // Input validation
    if (!originalName || typeof originalName !== 'string') {
      return {
        canonicalName: '',
        fragranceLine: '',
        needsNormalization: false,
        changes: ['Error: Invalid input'],
        confidence: 0.0
      }
    }

    const changes: string[] = []
    let working = originalName.trim()
    let needsNormalization = false

    // Skip if already looks canonical
    if (this.isAlreadyCanonical(working, brandName)) {
      return {
        canonicalName: working,
        fragranceLine: working,
        needsNormalization: false,
        changes: [],
        confidence: 1.0
      }
    }

    // Step 1: Extract and normalize concentration
    const { name: nameWithoutConcentration, concentration, changes: concChanges } = 
      this.extractConcentration(working)
    working = nameWithoutConcentration
    changes.push(...concChanges)
    if (concChanges.length > 0) needsNormalization = true

    // Step 2: Handle Chanel-specific patterns
    const { name: nameAfterChanel, changes: chanelChanges } = 
      this.handleChanelSpecialCases(working, brandName)
    working = nameAfterChanel
    changes.push(...chanelChanges)
    if (chanelChanges.length > 0) needsNormalization = true

    // Step 3: Fix capitalization issues
    const { name: nameAfterCaps, changes: capsChanges } = 
      this.fixCapitalization(working)
    working = nameAfterCaps
    changes.push(...capsChanges)
    if (capsChanges.length > 0) needsNormalization = true

    // Step 4: Remove year suffixes
    const { name: nameAfterYear, changes: yearChanges } = 
      this.removeYearSuffixes(working)
    working = nameAfterYear
    changes.push(...yearChanges)
    if (yearChanges.length > 0) needsNormalization = true

    // Step 5: Handle variant numbers like "(2)"
    const { name: nameAfterVariant, concentration: updatedConcentration, changes: variantChanges } = 
      this.handleVariantNumbers(working, concentration)
    working = nameAfterVariant
    const finalConcentration = updatedConcentration || concentration
    changes.push(...variantChanges)
    if (variantChanges.length > 0) needsNormalization = true

    // Step 6: Extract core fragrance line (for fragranceLine return value)
    let fragranceLine = working
    
    // For Chanel No 5 variations, extract just the core name
    if (brandName?.toLowerCase().includes('chanel')) {
      if (working.toLowerCase().includes('no 5')) {
        fragranceLine = working.match(/no \d+/i)?.[0] || working
      }
    }
    
    // Step 7: Handle brand aliases first
    if (brandName) {
      // Check for brand aliases in the name and replace them
      for (const [alias, fullBrand] of Object.entries(this.BRAND_ALIASES)) {
        if (fullBrand.toLowerCase() === brandName.toLowerCase()) {
          const aliasRegex = new RegExp(`\\b${alias}\\b`, 'gi')
          if (aliasRegex.test(working)) {
            working = working.replace(aliasRegex, brandName)
            changes.push(`Expanded brand alias: ${alias} → ${brandName}`)
            needsNormalization = true
          }
        }
      }
    }
    
    // Step 8: Build canonical name (always include brand prefix for canonical form)
    let canonicalName = working
    if (brandName) {
      const nameLower = working.toLowerCase()
      const brandLower = brandName.toLowerCase()
      
      if (nameLower.includes(brandLower)) {
        // Brand exists in fragrance line but may need case fixing
        const brandRegex = new RegExp(brandName, 'i')
        if (!working.includes(brandName)) {
          // Fix brand capitalization in working name first
          working = working.replace(brandRegex, brandName)
          changes.push(`Fixed brand capitalization: ${brandName}`)
          needsNormalization = true
        }
        
        // For canonical name, ensure proper brand prefix and capitalization
        if (working.toLowerCase().startsWith(brandLower + ' ') || working.toLowerCase().startsWith(brandLower)) {
          // Brand is at start but may need capitalization fix
          canonicalName = working.replace(brandRegex, brandName)
          if (canonicalName !== working) {
            changes.push(`Fixed brand capitalization: ${brandName}`)
            needsNormalization = true
          } else {
            canonicalName = working
          }
        } else {
          // Brand is embedded in line, add as prefix for canonical form
          canonicalName = `${brandName} ${working}`
          changes.push(`Added brand prefix for canonical form: ${brandName}`)
          needsNormalization = true
        }
      } else {
        // Brand missing, add it
        canonicalName = `${brandName} ${working}`
        changes.push(`Added brand context: ${brandName}`)
        needsNormalization = true
      }
    }

    // Step 9: Add concentration back if extracted
    if (finalConcentration && !canonicalName.toLowerCase().includes(finalConcentration.toLowerCase())) {
      canonicalName = `${canonicalName} ${finalConcentration}`
      changes.push(`Added concentration: ${finalConcentration}`)
      needsNormalization = true
    }

    // Calculate confidence score
    const confidence = this.calculateConfidence(changes, originalName, canonicalName)

    return {
      canonicalName: canonicalName.trim(),
      fragranceLine: fragranceLine.trim(),
      concentration: finalConcentration,
      needsNormalization,
      changes,
      confidence
    }
  }

  /**
   * Check if fragrance name is already in canonical format
   */
  private isAlreadyCanonical(name: string, brandName?: string): boolean {
    // Check for obvious formatting issues
    const hasProperCaps = !name.match(/[A-Z]{3,}/) // No long all-caps sequences
    const hasProperArticles = !name.match(/\b(De|And|Of|The)\b/) // Proper article caps
    const noYearSuffix = !name.match(/\s*\(?20\d{2}\)?$/) // No year suffix
    const hasConcentrationIfAny = !name.match(/\b(EDP|EDT|EDC)\b/) // No abbrev concentrations
    
    if (brandName) {
      const hasBrandContext = name.toLowerCase().includes(brandName.toLowerCase())
      const hasProperBrandCaps = name.includes(brandName) // Exact case match
      
      // If brand is present but wrong case, not canonical
      if (hasBrandContext && !hasProperBrandCaps) {
        return false
      }
      
      return hasProperCaps && hasProperArticles && noYearSuffix && hasConcentrationIfAny && hasBrandContext
    }
    
    return hasProperCaps && hasProperArticles && noYearSuffix && hasConcentrationIfAny
  }

  /**
   * Extract and normalize concentration from fragrance name
   */
  private extractConcentration(name: string): { name: string, concentration?: string, changes: string[] } {
    const changes: string[] = []
    let concentration: string | undefined
    
    // Look for concentration abbreviations (case insensitive)
    const concentrationRegex = /\b(edp|edt|edc|parfum|cologne|extrait|aftershave)\b/i
    const match = name.match(concentrationRegex)
    
    if (match) {
      const rawConcentration = match[1].toLowerCase()
      const normalized = this.CONCENTRATION_MAP[rawConcentration]
      
      if (normalized && normalized !== match[1]) {
        concentration = normalized
        changes.push(`Expanded concentration: ${match[1]} → ${normalized}`)
      } else {
        concentration = this.capitalizeFirstLetter(match[1])
      }
      
      // Remove from name
      name = name.replace(concentrationRegex, '').trim()
    }

    return { name, concentration, changes }
  }

  /**
   * Handle Chanel-specific patterns
   */
  private handleChanelSpecialCases(name: string, brandName?: string): { name: string, changes: string[] } {
    const changes: string[] = []
    let working = name

    // Only apply Chanel rules if brand is Chanel
    if (brandName?.toLowerCase().includes('chanel')) {
      // Handle number abbreviations (N05 → No 5)
      for (const [abbrev, full] of Object.entries(this.CHANEL_NUMBER_MAP)) {
        const regex = new RegExp(`\\b${abbrev}\\b`, 'gi')
        if (regex.test(working)) {
          working = working.replace(regex, full)
          changes.push(`Fixed abbreviation: ${abbrev.toUpperCase()} → ${full}`)
        }
      }

      // Handle fragrance line completions (Bleu de → Bleu de Chanel)
      const nameLower = working.toLowerCase()
      for (const [partial, complete] of Object.entries(this.CHANEL_LINE_COMPLETIONS)) {
        if (nameLower.includes(partial) && !nameLower.includes(complete.toLowerCase())) {
          working = working.replace(new RegExp(partial, 'gi'), complete)
          changes.push(`Completed fragrance line: ${partial} → ${complete}`)
        }
      }

      // Handle Les Exclusifs collection
      for (const exclusif of this.CHANEL_EXCLUSIFS) {
        if (nameLower.includes(exclusif) && !nameLower.includes('les exclusifs')) {
          working = `Les Exclusifs de Chanel ${working}`
          changes.push('Added collection context: Les Exclusifs de Chanel')
          break
        }
      }
    }

    return { name: working, changes }
  }

  /**
   * Fix capitalization issues
   */
  private fixCapitalization(name: string): { name: string, changes: string[] } {
    const changes: string[] = []
    let working = name

    // Fix common article capitalization (De → de, And → and, etc.)
    const articleMap = {
      '\\bDe\\b': 'de',
      '\\bAnd\\b': 'and',
      '\\bOf\\b': 'of', 
      '\\bThe\\b': 'the',
      '\\bFor\\b': 'for',
      '\\bWith\\b': 'with',
      '\\bIn\\b': 'in'
    }

    const originalWorking = working
    for (const [pattern, replacement] of Object.entries(articleMap)) {
      const regex = new RegExp(pattern, 'g')
      if (regex.test(working)) {
        const match = working.match(regex)?.[0]
        if (match) {
          working = working.replace(regex, replacement)
          changes.push(`Fixed capitalization: ${match} → ${replacement}`)
        }
      }
    }

    // Fix all-caps words - handle both individual words and phrases
    const allCapsRegex = /\b[A-Z]{2,}\b/g
    const allCapsMatches = working.match(allCapsRegex)
    
    if (allCapsMatches) {
      // Process each match individually to get specific change messages
      const uniqueMatches = [...new Set(allCapsMatches)]
      uniqueMatches.forEach(match => {
        if (!this.PRESERVE_CAPS.has(match)) {
          const fixed = this.capitalizeFirstLetter(match)
          working = working.replace(new RegExp(`\\b${match}\\b`, 'g'), fixed)
          changes.push(`Fixed all-caps: ${match} → ${fixed}`)
        }
      })
    }

    // Also detect and report multi-word all-caps phrases (for specific reporting)
    const originalForPhrases = name // Use original to detect phrases before individual word changes
    const multiWordCapsRegex = /\b[A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?\b/g
    const multiWordMatches = originalForPhrases.match(multiWordCapsRegex)
    
    if (multiWordMatches) {
      multiWordMatches.forEach(match => {
        const fixed = match.split(' ').map(word => this.capitalizeFirstLetter(word)).join(' ')
        // Only add phrase change if it wasn't already covered by individual word changes
        const words = match.split(' ')
        const alreadyCovered = words.every(word => 
          changes.some(change => change.includes(`Fixed all-caps: ${word} →`))
        )
        if (!alreadyCovered) {
          changes.push(`Fixed all-caps: ${match} → ${fixed}`)
        }
      })
    }

    return { name: working, changes }
  }

  /**
   * Remove year suffixes from fragrance names
   */
  private removeYearSuffixes(name: string): { name: string, changes: string[] } {
    const changes: string[] = []
    let working = name

    // Remove years 2019 and earlier (likely reformulation markers)
    const oldYearRegex = /\s*\(?20(0[0-9]|1[0-9])\)?$/
    if (oldYearRegex.test(working)) {
      working = working.replace(oldYearRegex, '').trim()
      changes.push('Removed year suffix')
    }

    return { name: working, changes }
  }

  /**
   * Handle variant numbers like "(2)" which often indicate EDT vs EDP
   */
  private handleVariantNumbers(name: string, concentration?: string): { name: string, concentration?: string, changes: string[] } {
    const changes: string[] = []
    let working = name
    let inferredConcentration = concentration

    // Handle "(2)" pattern - often means EDT version of EDP fragrance
    const variantRegex = /\s*\((\d+)\)$/
    const match = working.match(variantRegex)
    
    if (match) {
      const variantNum = parseInt(match[1])
      working = working.replace(variantRegex, '').trim()
      
      // If no concentration provided, infer from variant number
      if (!concentration) {
        if (variantNum === 2) {
          inferredConcentration = 'Eau de Toilette'
          changes.push('Resolved variant number: (2) → EDT')
        } else {
          changes.push(`Removed variant number: (${variantNum})`)
        }
      } else {
        changes.push(`Removed variant number: (${variantNum})`)
      }
    }

    return { name: working, concentration: inferredConcentration, changes }
  }

  /**
   * Check if fragrance name needs brand context and handle case issues
   */
  private needsBrandContext(name: string, brandName: string): boolean {
    const nameLower = name.toLowerCase()
    const brandLower = brandName.toLowerCase()
    
    // Direct brand name check (case insensitive)
    if (nameLower.includes(brandLower)) {
      // Brand is present but check if it needs capitalization fix
      const brandRegex = new RegExp(brandName, 'i')
      if (!brandRegex.test(name)) {
        // Brand is there but wrong case - we'll fix in brand addition step
        return true
      }
      return false
    }

    // Check brand aliases
    for (const [alias, fullName] of Object.entries(this.BRAND_ALIASES)) {
      if (fullName.toLowerCase() === brandLower && nameLower.includes(alias)) {
        return false
      }
    }

    // Check if it contains significant brand words (for compound brands)
    const brandWords = brandName.split(' ')
    let foundWords = 0
    for (const word of brandWords) {
      if (word.length > 3 && nameLower.includes(word.toLowerCase())) {
        foundWords++
      }
    }
    
    // If most brand words are present, don't add brand context
    if (foundWords >= brandWords.length * 0.7) {
      return false
    }

    return true
  }

  /**
   * Calculate confidence score based on normalization changes
   */
  private calculateConfidence(changes: string[], originalName: string, canonicalName: string): number {
    if (changes.length === 0) return 1.0
    
    let confidence = 0.95 // Higher base confidence for normalization
    
    // Adjust confidence based on change types
    changes.forEach(change => {
      if (change.includes('Fixed all-caps')) {
        confidence += 0.01 // High confidence fix
      } else if (change.includes('Expanded concentration')) {
        confidence += 0.02 // Very high confidence fix
      } else if (change.includes('Added brand context')) {
        confidence += 0.02 // High confidence when adding known brand
      } else if (change.includes('Fixed capitalization')) {
        confidence += 0.01 // High confidence fix
      } else if (change.includes('Removed year suffix')) {
        confidence -= 0.03 // Slightly less certain about year removal
      } else if (change.includes('Fixed abbreviation')) {
        confidence += 0.02 // Good confidence for known abbreviations
      } else if (change.includes('Resolved variant number')) {
        confidence -= 0.08 // Less certain about variant interpretations
      } else if (change.includes('Added collection context')) {
        confidence += 0.01 // Good confidence for known collections
      } else if (change.includes('Completed fragrance line')) {
        confidence += 0.02 // Good confidence for known completions
      }
    })

    // Adjust for complexity
    if (changes.length === 1) {
      confidence += 0.02 // Simple single fix
    } else if (changes.length > 4) {
      confidence -= 0.08 // Very complex normalization
    } else if (changes.length > 2) {
      confidence -= 0.04 // Moderately complex
    }

    // Adjust for input quality indicators
    if (originalName.length < 8) {
      confidence -= 0.05 // Short names are more ambiguous
    }
    
    if (originalName.includes('Unknown')) {
      confidence -= 0.2 // Unknown elements are risky
    }

    // Adjust for result quality
    const lengthRatio = canonicalName.length / originalName.length
    if (lengthRatio > 2.5) {
      confidence -= 0.15 // Very long results may be over-expanded
    }

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  /**
   * Utility function to capitalize first letter
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  /**
   * Normalize a batch of fragrance names for efficiency
   */
  async normalizeBatch(
    fragrances: Array<{ id: string; name: string; brandName?: string }>
  ): Promise<Array<{ id: string; original: string; result: NormalizationResult }>> {
    return fragrances.map(fragrance => ({
      id: fragrance.id,
      original: fragrance.name,
      result: this.normalizeFragranceName(fragrance.name, fragrance.brandName)
    }))
  }

  /**
   * Get normalization statistics for a batch
   */
  analyzeNormalizationNeeds(
    fragrances: Array<{ name: string; brandName?: string }>
  ): {
    totalCount: number
    needsNormalization: number
    averageConfidence: number
    commonIssues: Record<string, number>
  } {
    const results = fragrances.map(f => 
      this.normalizeFragranceName(f.name, f.brandName)
    )

    const needsNormalization = results.filter(r => r.needsNormalization).length
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length

    // Count common issues
    const issueCount: Record<string, number> = {}
    results.forEach(result => {
      result.changes.forEach(change => {
        const issueType = change.split(':')[0] // Get issue type before colon
        issueCount[issueType] = (issueCount[issueType] || 0) + 1
      })
    })

    return {
      totalCount: fragrances.length,
      needsNormalization,
      averageConfidence,
      commonIssues: issueCount
    }
  }

  /**
   * Validate normalization result quality
   */
  validateNormalization(result: NormalizationResult): {
    isValid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // Check canonical name length
    if (result.canonicalName.length < 5) {
      issues.push('Canonical name too short')
    }
    if (result.canonicalName.length > 120) {
      issues.push('Canonical name too long')
    }

    // Check for remaining issues
    if (result.canonicalName.match(/[A-Z]{3,}/)) {
      issues.push('Still contains all-caps sequences')
    }
    if (result.canonicalName.match(/\b(EDP|EDT|EDC)\b/)) {
      issues.push('Still contains abbreviation concentrations')
    }
    if (result.canonicalName.match(/\s*\(?20\d{2}\)?/)) {
      issues.push('Still contains year suffixes')
    }

    // Check confidence threshold
    if (result.confidence < 0.7) {
      issues.push('Confidence score below acceptable threshold')
    }

    return {
      isValid: issues.length === 0,
      issues
    }
  }

  /**
   * Get suggested alternatives for ambiguous cases
   */
  getSuggestedAlternatives(originalName: string, brandName?: string): string[] {
    const alternatives: string[] = []
    
    // Try different interpretations for ambiguous cases
    if (originalName.includes('(2)')) {
      alternatives.push(
        this.normalizeFragranceName(originalName.replace('(2)', 'EDT'), brandName).canonicalName
      )
      alternatives.push(
        this.normalizeFragranceName(originalName.replace('(2)', 'Intense'), brandName).canonicalName
      )
    }

    // Try different brand interpretations
    if (brandName && originalName.toLowerCase().includes('armani')) {
      alternatives.push(
        this.normalizeFragranceName(originalName, 'Giorgio Armani').canonicalName
      )
      alternatives.push(
        this.normalizeFragranceName(originalName, 'Emporio Armani').canonicalName
      )
    }

    return alternatives.filter((alt, index, arr) => arr.indexOf(alt) === index) // Remove duplicates
  }
}